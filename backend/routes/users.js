import express from 'express';
import User from '../models/User.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';
import { awardPoints } from '../utils/gamification.js';

const router = express.Router();

const MAX_MANUAL_AWARD = 500;

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id }, { _id: 0, password: 0 });
    return res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { name, picture } = req.body;
    const user = await User.findOne({ user_id: req.user.user_id });
    
    if (name) user.name = name;
    if (picture) user.picture = picture;
    user.updated_at = new Date();
    
    await user.save();
    
    const updatedUser = await User.findOne({ user_id: req.user.user_id }, { _id: 0, password: 0 });
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Manual point award tool for TEACHER/ADMIN only. Regular point gains for
// students happen automatically and server-side (poll votes, completing
// content, quizzes, notes - see utils/gamification.js) so this is strictly
// for instructor bonuses, capped to prevent abuse even by trusted roles.
router.post('/:user_id/add-points', verifyToken, checkPermission('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { points, reason } = req.body;
    const targetUserId = req.params.user_id;

    if (!Number.isInteger(points) || points <= 0 || points > MAX_MANUAL_AWARD) {
      return res.status(400).json({ error: `Points must be a whole number between 1 and ${MAX_MANUAL_AWARD}` });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A reason is required for manual point awards' });
    }

    const targetUser = await User.findOne({ user_id: targetUserId });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await awardPoints(targetUserId, points, reason.trim());

    return res.status(200).json({
      message: 'Points added successfully',
      ...result
    });
  } catch (error) {
    console.error('Add points error:', error);
    return res.status(500).json({ error: 'Failed to add points' });
  }
});

export default router;
