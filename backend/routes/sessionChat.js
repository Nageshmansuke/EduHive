import express from 'express';
import SessionChat from '../models/SessionChat.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_LIMIT = 500;

// Note: video/whiteboard "sessions" here are ad-hoc rooms identified purely
// by a shared session_id (like a meeting link) rather than a persisted
// membership list - the same trust model VideoClassroom/Whiteboard already
// use (anyone holding the id/link can join). There is intentionally no
// separate membership ACL layered on top of that for chat.
router.get('/:session_id', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, MAX_HISTORY_LIMIT);
    const messages = await SessionChat.find(
      { session_id: req.params.session_id },
      { _id: 0 }
    ).sort({ created_at: 1 }).limit(limit);
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Get session chat error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { session_id, session_type, message } = req.body;
    if (!session_id || !message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'session_id and message are required' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
    }

    if (session_type && !['video', 'whiteboard'].includes(session_type)) {
      return res.status(400).json({ error: 'session_type must be video or whiteboard' });
    }

    const chatMsg = await SessionChat.create({
      session_id,
      session_type: session_type || 'video',
      user_id: req.user.user_id,
      user_name: req.user.name,
      user_picture: req.user.picture,
      message: message.trim()
    });

    const saved = {
      session_id: chatMsg.session_id,
      session_type: chatMsg.session_type,
      user_id: chatMsg.user_id,
      user_name: chatMsg.user_name,
      user_picture: chatMsg.user_picture,
      message: chatMsg.message,
      created_at: chatMsg.created_at
    };

    req.io.to(`chat_${session_id}`).emit('new_chat_message', saved);

    return res.status(201).json(saved);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
