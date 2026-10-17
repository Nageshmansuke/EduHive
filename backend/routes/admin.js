import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Poll from '../models/Poll.js';
import WhiteboardSession from '../models/WhiteboardSession.js';
import StudyNote from '../models/StudyNote.js';
import SessionChat from '../models/SessionChat.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';
import { deleteUserCascade } from '../utils/cascadeDelete.js';

const router = express.Router();

router.get('/users', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const users = await User.find({}, { _id: 0, password: 0 }).sort({ created_at: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:user_id/role', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // An admin changing their *own* role - especially demoting themselves -
    // is almost always a misclick, not an intentional action, and if it's
    // the only admin account it would lock the whole system out of the
    // admin panel with no way back in short of a direct DB edit.
    if (req.params.user_id === req.user.user_id) {
      return res.status(400).json({ error: 'Cannot change your own role. Ask another admin to do it.' });
    }

    const user = await User.findOne({ user_id: req.params.user_id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last remaining admin' });
      }
    }

    user.role = role;
    // Achievement tiers are student-only — clear when leaving STUDENT,
    // initialize BRONZE when becoming a student.
    if (role === 'STUDENT') {
      if (!user.tier) user.tier = 'BRONZE';
      user.updateTier();
    } else {
      user.tier = null;
    }
    user.updated_at = new Date();
    await user.save();

    const updated = await User.findOne({ user_id: user.user_id }, { _id: 0, password: 0 });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
});

router.delete('/users/:user_id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    if (req.params.user_id === req.user.user_id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const user = await User.findOne({ user_id: req.params.user_id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last remaining admin' });
      }
    }

    // Previously this only deleted the User document, leaving behind
    // orphaned courses/notes (with their physical files never cleaned up),
    // ghost entries in study group member lists, and a dangling progress/
    // leaderboard/session record for a user that no longer exists.
    const cascadeResult = await deleteUserCascade(req.params.user_id);
    await User.deleteOne({ user_id: req.params.user_id });

    return res.status(200).json({ message: 'User deleted', ...cascadeResult });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/analytics', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const [
      totalUsers,
      studentCount,
      teacherCount,
      adminCount,
      totalCourses,
      approvedCourses,
      pendingCourses,
      totalPolls,
      activePolls,
      totalWhiteboards,
      activeWhiteboards,
      totalNotes,
      totalMessages,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'TEACHER' }),
      User.countDocuments({ role: 'ADMIN' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'APPROVED' }),
      Course.countDocuments({ status: 'PENDING' }),
      Poll.countDocuments(),
      Poll.countDocuments({ is_active: true }),
      WhiteboardSession.countDocuments(),
      WhiteboardSession.countDocuments({ is_active: true }),
      StudyNote.countDocuments(),
      SessionChat.countDocuments(),
      User.find({}, { _id: 0, password: 0 }).sort({ created_at: -1 }).limit(10)
    ]);

    return res.status(200).json({
      users: { total: totalUsers, students: studentCount, teachers: teacherCount, admins: adminCount },
      courses: { total: totalCourses, approved: approvedCourses, pending: pendingCourses },
      polls: { total: totalPolls, active: activePolls },
      whiteboards: { total: totalWhiteboards, active: activeWhiteboards },
      notes: { total: totalNotes },
      messages: { total: totalMessages },
      recent_users: recentUsers
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
