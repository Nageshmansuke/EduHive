import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Send, X, MessageCircle } from 'lucide-react';
import { EmptyState } from './PageState';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const SessionChatPanel = ({ sessionId, sessionType = 'video', isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await axios.get(`${API_URL}/api/session-chat/${sessionId}`, { withCredentials: true });
      setMessages(res.data);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) fetchMessages();
  }, [isOpen, sessionId, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!socket || !sessionId) return;
    socket.emit('join_chat_room', { session_id: sessionId });

    socket.on('new_chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.emit('leave_chat_room', { session_id: sessionId });
      socket.off('new_chat_message');
    };
  }, [socket, sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await axios.post(`${API_URL}/api/session-chat`, {
        session_id: sessionId,
        session_type: sessionType,
        message: input.trim()
      }, { withCredentials: true });
      setInput('');
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: easeOut }}
      className="flex flex-col h-full w-80 bg-card border-l border-border"
      data-testid="session-chat-panel"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="eh-icon-well h-8 w-8 flex-shrink-0">
            <MessageCircle size={15} strokeWidth={1.75} />
          </span>
          <h4 className="text-sm font-semibold text-foreground font-heading truncate">Session Chat</h4>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="eh-btn-ghost p-1.5 flex-shrink-0"
          data-testid="close-chat-panel"
        >
          <X size={15} strokeWidth={1.75} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Start the conversation!"
            className="border-none shadow-none bg-transparent p-6"
          />
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMe = msg.user_id === user?.user_id;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: easeOut }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <p className="eh-meta mb-0.5 ml-1">{msg.user_name}</p>
                  )}
                  <div
                    className={`px-3 py-2 text-sm font-body rounded-[10px] ${
                      isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="leading-relaxed break-words">{msg.message}</p>
                  </div>
                  <p className="eh-meta mt-1 mx-1 opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border flex items-center gap-2 flex-shrink-0 bg-card">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          data-testid="session-chat-input"
          className="eh-input flex-1 min-w-0"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          data-testid="session-chat-send"
          className="eh-btn-primary p-2.5 flex-shrink-0"
        >
          <Send size={15} strokeWidth={1.75} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SessionChatPanel;
