import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, Copy, CheckCircle,
  MessageSquare, UserX, DoorOpen, X, Sparkles, Shield, User, Radio
} from 'lucide-react';
import SessionChatPanel from '../components/SessionChatPanel';

const easeOut = [0.23, 1, 0.32, 1];

const VideoClassroom = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [inSession, setInSession] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const localVideoRef = useRef(null);
  const localStream = useRef(null);
  const peerConnections = useRef({});
  const sessionIdRef = useRef('');

  const canHost = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const cleanupMedia = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    Object.values(peerConnections.current).forEach((pc) => {
      try { pc.close(); } catch (_) { /* ignore */ }
    });
    peerConnections.current = {};
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  const resetSessionState = useCallback((message = '') => {
    cleanupMedia();
    setInSession(false);
    setIsHost(false);
    setSessionId('');
    sessionIdRef.current = '';
    setInputSessionId('');
    setParticipants([]);
    setShowChat(false);
    setShowParticipants(false);
    if (message) setStatusMsg(message);
  }, [cleanupMedia]);

  const generateSessionId = () => {
    if (!canHost) return;
    const id = `class_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(id);
    setInputSessionId(id);
    setErrorMsg('');
    setStatusMsg('');
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Failed to get video:', error);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current = audioStream;
        setIsVideoOn(false);
        alert('Video not available. Using audio only. Check camera permissions.');
      } catch (audioError) {
        console.error('Failed to get audio:', audioError);
        alert('Could not access microphone. Please check permissions and try again.');
      }
    }
  };

  const joinSession = async () => {
    const sid = inputSessionId.trim();
    if (!sid || !socket) return;
    setErrorMsg('');
    setStatusMsg('');

    setSessionId(sid);
    sessionIdRef.current = sid;
    await startLocalStream();

    socket.emit('join_video_session', { session_id: sid });
  };

  const leaveSession = () => {
    if (socket && sessionIdRef.current) {
      socket.emit('leave_video_session', { session_id: sessionIdRef.current });
    }
    resetSessionState();
  };

  const endMeeting = () => {
    if (!canHost || !socket || !sessionIdRef.current) return;
    if (!window.confirm('End this meeting for everyone? Students will be disconnected and cannot rejoin.')) return;
    socket.emit('end_video_session', { session_id: sessionIdRef.current });
  };

  const removeParticipant = (targetSocketId, name) => {
    if (!canHost || !socket || !sessionIdRef.current) return;
    if (!window.confirm(`Remove ${name} from the meeting?`)) return;
    socket.emit('remove_participant', {
      session_id: sessionIdRef.current,
      target_socket_id: targetSocketId
    });
  };

  const createPeerConnectionRef = useRef(null);

  createPeerConnectionRef.current = (targetSocketId, isInitiator = true) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current);
      });
    }

    pc.ontrack = (event) => {
      const remoteVideo = document.getElementById(`remote-video-${targetSocketId}`);
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          target: targetSocketId,
          candidate: event.candidate,
          session_id: sessionIdRef.current
        });
      }
    };

    peerConnections.current[targetSocketId] = pc;

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (socket) {
            socket.emit('webrtc_offer', {
              target: targetSocketId,
              offer: pc.localDescription,
              session_id: sessionIdRef.current
            });
          }
        })
        .catch((err) => console.error('Create offer error:', err));
    }

    return pc;
  };

  useEffect(() => {
    if (!socket) return;

    const handleSessionJoined = (data) => {
      setInSession(true);
      setIsHost(data.is_host);
      setParticipants(data.participants || []);
      setErrorMsg('');
      setStatusMsg('');

      (data.participants || []).forEach((p) => {
        if (p.socket_id !== socket.id && createPeerConnectionRef.current) {
          createPeerConnectionRef.current(p.socket_id, true);
        }
      });
    };

    const handleUserJoined = (data) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socket_id === data.socket_id)) return prev;
        return [...prev, data];
      });
      if (createPeerConnectionRef.current) {
        createPeerConnectionRef.current(data.socket_id, false);
      }
    };

    const handleUserLeft = (data) => {
      if (peerConnections.current[data.socket_id]) {
        peerConnections.current[data.socket_id].close();
        delete peerConnections.current[data.socket_id];
      }
      setParticipants((prev) => prev.filter((p) => p.socket_id !== data.socket_id));
    };

    const handleOffer = async ({ sender, offer }) => {
      const pc = createPeerConnectionRef.current
        ? createPeerConnectionRef.current(sender, false)
        : null;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', {
          target: sender,
          answer: pc.localDescription,
          session_id: sessionIdRef.current
        });
      } catch (err) {
        console.error('Handle offer error:', err);
      }
    };

    const handleAnswer = async ({ sender, answer }) => {
      const pc = peerConnections.current[sender];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Handle answer error:', err);
        }
      }
    };

    const handleIceCandidate = async ({ sender, candidate }) => {
      const pc = peerConnections.current[sender];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Handle ICE error:', err);
        }
      }
    };

    const handleSessionEnded = ({ reason }) => {
      resetSessionState(reason || 'The host has ended this meeting.');
    };

    const handleParticipantRemoved = ({ reason }) => {
      resetSessionState(reason || 'You were removed from this meeting by the host.');
    };

    const handleSessionError = ({ message }) => {
      setErrorMsg(message);
    };

    socket.on('video_session_joined', handleSessionJoined);
    socket.on('user_joined_video', handleUserJoined);
    socket.on('user_left_video', handleUserLeft);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('session_ended', handleSessionEnded);
    socket.on('participant_removed', handleParticipantRemoved);
    socket.on('session_error', handleSessionError);

    return () => {
      socket.off('video_session_joined', handleSessionJoined);
      socket.off('user_joined_video', handleUserJoined);
      socket.off('user_left_video', handleUserLeft);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('session_ended', handleSessionEnded);
      socket.off('participant_removed', handleParticipantRemoved);
      socket.off('session_error', handleSessionError);
    };
  }, [socket, resetSessionState]);

  useEffect(() => {
    return () => {
      cleanupMedia();
      if (socket && sessionIdRef.current) {
        socket.emit('leave_video_session', { session_id: sessionIdRef.current });
      }
    };
  }, [cleanupMedia, socket]);

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-session Lobby View
  if (!inSession) {
    return (
      <AppLayout title="Live Classroom">
        <div className="max-w-xl mx-auto space-y-6 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 mb-3">
              <Radio size={14} className="animate-pulse" />
              WebRTC Encrypted Streaming
            </div>
            <h2 className="text-3xl font-extrabold font-heading tracking-tight text-foreground">
              Live Interactive Classroom
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-body mt-1">
              {canHost ? 'Launch an interactive cohort lecture or enter an existing session' : 'Enter the session ID provided by your instructor to join the live room'}
            </p>
          </motion.div>

          {(errorMsg || statusMsg) && (
            <div
              className={`rounded-2xl border px-4 py-3.5 text-xs font-semibold font-body shadow-lift-sm ${
                errorMsg
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
              data-testid="session-status-message"
            >
              {errorMsg || statusMsg}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.25, ease: easeOut }}
            className="eh-card-glow rounded-3xl p-6 sm:p-8 shadow-lift border border-border"
          >
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block font-heading">
                  Meeting Session ID
                </label>
                <input
                  type="text"
                  placeholder={canHost ? 'e.g. class_1740000000_abcde' : 'Paste session ID from instructor'}
                  value={inputSessionId}
                  onChange={(e) => setInputSessionId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && inputSessionId.trim() && joinSession()}
                  data-testid="session-id-input"
                  className="eh-input rounded-xl py-3 text-sm font-mono tracking-wide"
                />
              </div>

              <div className={`grid gap-3 ${canHost ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {canHost && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={generateSessionId}
                    data-testid="generate-session-button"
                    className="eh-btn-outline h-12 text-xs font-bold rounded-xl"
                  >
                    Generate Room ID
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={joinSession}
                  disabled={!inputSessionId.trim()}
                  data-testid="join-session-button"
                  className="eh-btn-primary h-12 text-xs font-bold rounded-xl shadow-lift disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Video size={16} strokeWidth={2.2} />
                  <span>{canHost ? 'Start / Enter Classroom' : 'Join Classroom'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const remoteParticipants = participants.filter((p) => p.socket_id !== socket?.id);
  const allVisibleParticipants = [
    { socket_id: socket?.id, user_id: user?.user_id, user_name: user?.name, role: user?.role, is_host: isHost, isSelf: true },
    ...remoteParticipants.map((p) => ({ ...p, isSelf: false }))
  ];

  return (
    <AppLayout title="Live Classroom">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: easeOut }}
        className="max-w-6xl mx-auto space-y-4"
      >
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 px-4 py-3 text-xs font-semibold font-body">
            {errorMsg}
          </div>
        )}

        {/* Top Meeting Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-card border border-border/80 px-4 py-3 rounded-2xl shadow-lift-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest font-heading">LIVE</span>
            </div>

            <button
              type="button"
              onClick={() => setShowParticipants((v) => !v)}
              className="eh-btn-outline h-8 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5"
              data-testid="participants-toggle"
            >
              <Users size={14} />
              <span className="tabular-nums">{participants.length + 1}</span>
            </button>

            {isHost && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Instructor Host
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px] sm:max-w-none">
              {sessionId}
            </span>
            <button
              onClick={copySessionId}
              className="eh-btn-ghost h-8 px-2 rounded-lg text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
              data-testid="copy-session-id"
              title="Copy session link"
            >
              {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="text-[11px] hidden sm:inline">{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>
        </div>

        {/* Participants Sheet / Overlay */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="eh-card-glow rounded-2xl p-5 shadow-lift overflow-hidden"
              data-testid="participants-panel"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                <h3 className="eh-section-title text-sm">Active Cohort ({allVisibleParticipants.length})</h3>
                <button type="button" onClick={() => setShowParticipants(false)} className="eh-btn-ghost p-1 rounded-lg">
                  <X size={15} />
                </button>
              </div>
              <ul className="divide-y divide-border/50 max-h-48 overflow-y-auto">
                {allVisibleParticipants.map((p) => (
                  <li
                    key={p.socket_id || p.user_id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold font-heading text-foreground truncate">
                        {p.user_name}{p.isSelf ? ' (You)' : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {p.is_host ? 'Host • ' : ''}{p.role?.toLowerCase()}
                      </p>
                    </div>
                    {canHost && isHost && !p.isSelf && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.socket_id, p.user_name)}
                        data-testid={`remove-participant-${p.socket_id}`}
                        className="eh-btn-ghost h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600 rounded-md"
                      >
                        <UserX size={13} />
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Local User Tile */}
          <div className="bg-slate-950 border border-border/80 rounded-2xl overflow-hidden aspect-video relative shadow-lift group">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" data-testid="local-video" />
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-[11px] font-bold font-heading flex items-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>You ({user?.name})</span>
            </div>
            {!isVideoOn && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-lg font-heading">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs text-muted-foreground font-medium">Camera is disabled</span>
              </div>
            )}
          </div>

          {/* Remote Participants */}
          <AnimatePresence>
            {remoteParticipants.map((p) => (
              <motion.div
                key={p.socket_id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: easeOut }}
                className="bg-slate-950 border border-border/80 rounded-2xl overflow-hidden aspect-video relative shadow-lift"
              >
                <video id={`remote-video-${p.socket_id}`} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-[11px] font-bold font-heading border border-white/10">
                  {p.user_name}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Controls Dock */}
        <div className="sticky bottom-4 z-30 flex items-center justify-center">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/80 shadow-lift-lg">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleAudio}
              data-testid="toggle-audio-button"
              className={`p-3 rounded-xl transition-all ${
                isAudioOn
                  ? 'bg-muted/80 text-foreground hover:bg-muted'
                  : 'bg-rose-500 text-white shadow-lift-sm'
              }`}
              title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleVideo}
              data-testid="toggle-video-button"
              className={`p-3 rounded-xl transition-all ${
                isVideoOn
                  ? 'bg-muted/80 text-foreground hover:bg-muted'
                  : 'bg-rose-500 text-white shadow-lift-sm'
              }`}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </motion.button>

            <div className="w-px h-6 bg-border mx-1" />

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={leaveSession}
              data-testid="leave-session-button"
              className="p-3 rounded-xl bg-muted/80 text-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              title="Leave classroom"
            >
              <DoorOpen size={18} />
            </motion.button>

            {canHost && isHost && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={endMeeting}
                data-testid="end-meeting-button"
                className="h-10 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-lift-sm"
                title="End meeting for everyone"
              >
                <PhoneOff size={15} />
                <span>End Meeting</span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(!showChat)}
              data-testid="toggle-chat-button"
              className={`p-3 rounded-xl transition-all ${
                showChat
                  ? 'bg-primary text-primary-foreground shadow-lift-sm'
                  : 'bg-muted/80 text-foreground hover:bg-muted'
              }`}
              title="Toggle Classroom Chat"
            >
              <MessageSquare size={18} />
            </motion.button>
          </div>
        </div>

        {/* Live Chat Panel Drawer */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: 28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 28, opacity: 0 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="fixed right-0 top-0 h-full z-50"
            >
              <SessionChatPanel sessionId={sessionId} sessionType="video" isOpen={showChat} onClose={() => setShowChat(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
};

export default VideoClassroom;
