import express from 'express';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import User from '../models/User.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Leaderboard is a student feature. Teachers are excluded from viewing/participating.
const studentOrAdmin = checkPermission('STUDENT', 'ADMIN');

/** Return leaderboard rows for STUDENT accounts only (teachers never appear). */
const studentLeaderboardEntries = async (sortField) => {
  const studentIds = await User.find({ role: 'STUDENT' }).distinct('user_id');
  const entries = await LeaderboardEntry.find(
    { user_id: { $in: studentIds } },
    { _id: 0 }
  )
    .sort({ [sortField]: -1 })
    .limit(100);

  return entries.map((entry, index) => ({
    ...entry.toObject(),
    rank: index + 1
  }));
};

router.get('/overall', verifyToken, studentOrAdmin, async (req, res) => {
  try {
    return res.status(200).json(await studentLeaderboardEntries('points'));
  } catch (error) {
    console.error('Get overall leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/weekly', verifyToken, studentOrAdmin, async (req, res) => {
  try {
    return res.status(200).json(await studentLeaderboardEntries('weekly_points'));
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
  }
});

router.get('/monthly', verifyToken, studentOrAdmin, async (req, res) => {
  try {
    return res.status(200).json(await studentLeaderboardEntries('monthly_points'));
  } catch (error) {
    console.error('Get monthly leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch monthly leaderboard' });
  }
});

// Recomputes overall/weekly/monthly ranks. Restricted to ADMIN - previously
// any authenticated user could trigger this (cheap DoS via repeated N+1
// writes) and it also had no effect other users could rely on. Rewritten
// with bulkWrite so it's O(1) round trips instead of O(3n).
router.post('/refresh', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const buildRankOps = async (sortField, rankField) => {
      const entries = await LeaderboardEntry.find({}, { user_id: 1 }).sort({ [sortField]: -1 });
      return entries.map((entry, index) => ({
        updateOne: {
          filter: { user_id: entry.user_id },
          update: { $set: { [rankField]: index + 1 } }
        }
      }));
    };

    const ops = [
      ...(await buildRankOps('points', 'overall_rank')),
      ...(await buildRankOps('weekly_points', 'weekly_rank')),
      ...(await buildRankOps('monthly_points', 'monthly_rank'))
    ];

    if (ops.length > 0) {
      await LeaderboardEntry.bulkWrite(ops);
    }

    req.io.emit('leaderboard_updated');

    return res.status(200).json({ message: 'Leaderboard refreshed successfully', entries_updated: ops.length });
  } catch (error) {
    console.error('Refresh leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to refresh leaderboard' });
  }
});

// Resets the rolling weekly/monthly counters. In production this should be
// invoked by a scheduled job (e.g. node-cron or an external scheduler) at
// the start of each week/month; exposed here as an ADMIN-only manual
// trigger since no scheduler dependency exists in this codebase yet.
router.post('/reset-weekly', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const result = await LeaderboardEntry.updateMany({}, { $set: { weekly_points: 0, weekly_rank: null } });
    req.io.emit('leaderboard_updated');
    return res.status(200).json({ message: 'Weekly leaderboard reset', modified: result.modifiedCount });
  } catch (error) {
    console.error('Reset weekly leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to reset weekly leaderboard' });
  }
});

router.post('/reset-monthly', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const result = await LeaderboardEntry.updateMany({}, { $set: { monthly_points: 0, monthly_rank: null } });
    req.io.emit('leaderboard_updated');
    return res.status(200).json({ message: 'Monthly leaderboard reset', modified: result.modifiedCount });
  } catch (error) {
    console.error('Reset monthly leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to reset monthly leaderboard' });
  }
});

export default router;
