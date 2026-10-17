import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WhiteboardSession from '../models/WhiteboardSession.js';
import { verifyToken } from '../middleware/auth.js';
import { updateWhiteboardPermission, persistWhiteboardActions } from '../sockets/videoChat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const snapshotsDir = process.env.VERCEL
  ? path.join('/tmp', 'eduhive-uploads', 'snapshots')
  : path.join(__dirname, '../uploads/snapshots');
if (!fs.existsSync(snapshotsDir)) {
  fs.mkdirSync(snapshotsDir, { recursive: true });
}

const MAX_ACTIONS_PAYLOAD = 3000;

const isBoardOwnerOrAdmin = (session, user) =>
  session.created_by === user.user_id || user.role === 'ADMIN';

const canEditBoard = (session, user) => {
  if (isBoardOwnerOrAdmin(session, user)) return true;
  const participant = session.participants.find((p) => p.user_id === user.user_id);
  return !!participant?.can_draw;
};

router.get('/', verifyToken, async (req, res) => {
  try {
    // Omit heavy actions arrays from lobby listing.
    const sessions = await WhiteboardSession.find({}, { _id: 0, actions: 0 }).sort({ created_at: -1 });
    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Get whiteboard sessions error:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:session_id', verifyToken, async (req, res) => {
  try {
    const session = await WhiteboardSession.findOne({ session_id: req.params.session_id }, { _id: 0 });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json(session);
  } catch (error) {
    console.error('Get whiteboard session error:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Any authenticated user (teacher or student) may create a whiteboard.
// Creator becomes the owner/host with draw authority.
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, course_id } = req.body;
    const session = new WhiteboardSession({
      name: name || 'Untitled Whiteboard',
      created_by: req.user.user_id,
      creator_name: req.user.name,
      course_id: course_id || null,
      actions: [],
      participants: [{
        user_id: req.user.user_id,
        name: req.user.name,
        can_draw: true
      }]
    });
    await session.save();
    const saved = await WhiteboardSession.findOne({ session_id: session.session_id }, { _id: 0, actions: 0 });
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Create whiteboard session error:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

// Persist stroke history. Only owner or users with draw authority may save.
router.put('/:session_id/actions', verifyToken, async (req, res) => {
  try {
    const { actions } = req.body;
    if (!Array.isArray(actions)) {
      return res.status(400).json({ error: 'actions must be an array' });
    }
    if (actions.length > MAX_ACTIONS_PAYLOAD) {
      return res.status(413).json({ error: 'Too many actions to save' });
    }

    const session = await WhiteboardSession.findOne({ session_id: req.params.session_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.is_active) return res.status(400).json({ error: 'Whiteboard is closed' });
    if (!canEditBoard(session, req.user)) {
      return res.status(403).json({ error: 'No editing authority on this whiteboard' });
    }

    session.actions = actions;
    session.actions_updated_at = new Date();
    await session.save();

    // Keep live in-memory state aligned if the room is active.
    persistWhiteboardActions(session.session_id, actions, { fromClient: true });

    return res.status(200).json({
      message: 'Whiteboard saved',
      session_id: session.session_id,
      actions_count: actions.length,
      actions_updated_at: session.actions_updated_at
    });
  } catch (error) {
    console.error('Save whiteboard actions error:', error);
    return res.status(500).json({ error: 'Failed to save whiteboard' });
  }
});

// Only the board creator (or platform ADMIN) may manage draw permissions —
// role alone is not enough (students who own a board must manage it too).
router.patch('/:session_id/permission', verifyToken, async (req, res) => {
  try {
    const { user_id, can_draw } = req.body;
    const session = await WhiteboardSession.findOne({ session_id: req.params.session_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (!isBoardOwnerOrAdmin(session, req.user)) {
      return res.status(403).json({ error: 'Not authorized to manage this whiteboard' });
    }

    if (user_id === session.created_by) {
      return res.status(400).json({ error: 'Cannot revoke the owner\'s drawing authority' });
    }

    const participant = session.participants.find(p => p.user_id === user_id);
    if (!participant) {
      return res.status(404).json({ error: 'That user has not joined this whiteboard yet' });
    }
    participant.can_draw = !!can_draw;
    await session.save();

    updateWhiteboardPermission(session.session_id, user_id, !!can_draw);

    req.io.to(`wb_${session.session_id}`).emit('permission_changed', { user_id, can_draw: !!can_draw });

    const updated = await WhiteboardSession.findOne({ session_id: session.session_id }, { _id: 0, actions: 0 });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update permission error:', error);
    return res.status(500).json({ error: 'Failed to update permission' });
  }
});

const MAX_SNAPSHOT_BYTES = 10 * 1024 * 1024; // 10MB decoded

router.post('/:session_id/snapshot', verifyToken, async (req, res) => {
  try {
    const { image_data } = req.body;
    if (!image_data || !/^data:image\/png;base64,/.test(image_data)) {
      return res.status(400).json({ error: 'image_data must be a base64-encoded PNG data URL' });
    }

    const session = await WhiteboardSession.findOne({ session_id: req.params.session_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isParticipant = session.created_by === req.user.user_id
      || session.participants.some((p) => p.user_id === req.user.user_id);
    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only participants of this whiteboard can save a snapshot' });
    }

    const base64Data = image_data.replace(/^data:image\/png;base64,/, '');
    if (Buffer.byteLength(base64Data, 'base64') > MAX_SNAPSHOT_BYTES) {
      return res.status(413).json({ error: 'Snapshot is too large' });
    }

    const filename = `snapshot_${session.session_id}_${Date.now()}.png`;
    const filePath = path.join(snapshotsDir, filename);

    fs.writeFileSync(filePath, base64Data, 'base64');

    session.snapshot_url = `/uploads/snapshots/${filename}`;
    await session.save();

    const updated = await WhiteboardSession.findOne({ session_id: session.session_id }, { _id: 0, actions: 0 });
    return res.status(200).json({ message: 'Snapshot saved', session: updated });
  } catch (error) {
    console.error('Save snapshot error:', error);
    return res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

router.patch('/:session_id/close', verifyToken, async (req, res) => {
  try {
    const session = await WhiteboardSession.findOne({ session_id: req.params.session_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (!isBoardOwnerOrAdmin(session, req.user)) {
      return res.status(403).json({ error: 'Not authorized to close this whiteboard' });
    }

    session.is_active = false;
    await session.save();

    req.io.to(`wb_${session.session_id}`).emit('whiteboard_closed');

    const updated = await WhiteboardSession.findOne({ session_id: session.session_id }, { _id: 0, actions: 0 });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Close whiteboard error:', error);
    return res.status(500).json({ error: 'Failed to close session' });
  }
});

// Only the creator (or platform ADMIN) may permanently delete a whiteboard.
router.delete('/:session_id', verifyToken, async (req, res) => {
  try {
    const session = await WhiteboardSession.findOne({ session_id: req.params.session_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (!isBoardOwnerOrAdmin(session, req.user)) {
      return res.status(403).json({ error: 'Only the creator can delete this whiteboard' });
    }

    if (session.snapshot_url) {
      const snapshotPath = path.join(__dirname, '..', session.snapshot_url.replace(/^\//, ''));
      if (fs.existsSync(snapshotPath)) {
        fs.unlink(snapshotPath, () => {});
      }
    }

    await WhiteboardSession.deleteOne({ session_id: req.params.session_id });
    req.io.to(`wb_${session.session_id}`).emit('whiteboard_closed');

    return res.status(200).json({ message: 'Whiteboard deleted', session_id: req.params.session_id });
  } catch (error) {
    console.error('Delete whiteboard error:', error);
    return res.status(500).json({ error: 'Failed to delete whiteboard' });
  }
});

export default router;
