import express from 'express';
import { verifyToken, checkPermission } from '../middleware/auth.js';
import {
  evaluateBadges,
  getOrCreateProgress,
  trackContentCompletion,
  trackQuizAttempt,
  trackNoteCreated
} from '../utils/gamification.js';

const router = express.Router();

// Progress tracking is student-only. Teachers must not participate.
const studentOnly = checkPermission('STUDENT');

// Students may only read their own progress; admins may read any student's.
router.get('/user/:user_id', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'TEACHER') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Progress tracking is available to students only'
      });
    }

    if (req.user.role !== 'STUDENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.params.user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const progress = await getOrCreateProgress(req.params.user_id);
    return res.status(200).json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Track content completion - awards points once per unique content item.
router.post('/track/content', verifyToken, studentOnly, async (req, res) => {
  try {
    const { content_id, time_spent } = req.body;
    if (!content_id) return res.status(400).json({ error: 'Content ID required' });

    const { progress, newlyAwardedBadges } = await trackContentCompletion(req.user.user_id, content_id, time_spent);

    return res.status(200).json({ ...progress.toObject(), newly_awarded_badges: newlyAwardedBadges.map(b => b.id) });
  } catch (error) {
    console.error('Track content error:', error);
    return res.status(500).json({ error: 'Failed to track progress' });
  }
});

// Track quiz attempt - awards points scaled by score percentage.
router.post('/track/quiz', verifyToken, studentOnly, async (req, res) => {
  try {
    const { quiz_id, score, total_questions } = req.body;
    if (!quiz_id || score === undefined || !total_questions) {
      return res.status(400).json({ error: 'Quiz ID, score, and total questions required' });
    }

    if (score < 0 || score > total_questions) {
      return res.status(400).json({ error: 'Score must be between 0 and total_questions' });
    }

    const { progress, newlyAwardedBadges } = await trackQuizAttempt(req.user.user_id, quiz_id, score, total_questions);

    return res.status(200).json({ ...progress.toObject(), newly_awarded_badges: newlyAwardedBadges.map(b => b.id) });
  } catch (error) {
    console.error('Track quiz error:', error);
    return res.status(500).json({ error: 'Failed to track quiz' });
  }
});

// Note creation itself already calls trackNoteCreated() directly (see
// routes/notes.js) so notes_created/points can never fall out of sync with
// this endpoint. This route is kept for API completeness / potential future
// clients but delegates to the exact same shared logic.
router.post('/track/note', verifyToken, studentOnly, async (req, res) => {
  try {
    await trackNoteCreated(req.user.user_id);
    const progress = await getOrCreateProgress(req.user.user_id);
    return res.status(200).json(progress);
  } catch (error) {
    console.error('Track note error:', error);
    return res.status(500).json({ error: 'Failed to track note' });
  }
});

// Re-evaluates the badge catalog against the caller's own current progress.
// Badge ids are never accepted from the client - eligibility is always
// computed server-side from real progress data (see utils/gamification.js).
router.post('/badge', verifyToken, studentOnly, async (req, res) => {
  try {
    const progress = await getOrCreateProgress(req.user.user_id);

    const newBadges = evaluateBadges(progress);
    progress.updated_at = new Date();
    await progress.save();

    return res.status(200).json({ ...progress.toObject(), newly_awarded_badges: newBadges.map(b => b.id) });
  } catch (error) {
    console.error('Award badge error:', error);
    return res.status(500).json({ error: 'Failed to award badge' });
  }
});

export default router;
