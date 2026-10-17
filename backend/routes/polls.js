import express from 'express';
import Poll from '../models/Poll.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';
import { awardPoints, POINTS } from '../utils/gamification.js';

const router = express.Router();

// Polls are a student feature. Teachers are excluded.
// Admins may create/close polls for platform moderation.
const studentOrAdmin = checkPermission('STUDENT', 'ADMIN');

router.get('/', verifyToken, studentOrAdmin, async (req, res) => {
  try {
    const { course_id, is_active } = req.query;
    const query = {};
    
    if (course_id) query.course_id = course_id;
    if (is_active !== undefined) query.is_active = is_active === 'true';

    const polls = await Poll.find(query, { _id: 0 }).sort({ created_at: -1 });
    return res.status(200).json(polls);
  } catch (error) {
    console.error('Get polls error:', error);
    return res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

router.get('/:poll_id', verifyToken, studentOrAdmin, async (req, res) => {
  try {
    const poll = await Poll.findOne({ poll_id: req.params.poll_id }, { _id: 0 });
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    return res.status(200).json(poll);
  } catch (error) {
    console.error('Get poll error:', error);
    return res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

router.post('/', verifyToken, checkPermission('STUDENT', 'ADMIN'), async (req, res) => {
  try {
    const { question, options, course_id } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }

    const formattedOptions = options.map((opt, index) => ({
      option_id: `opt_${Date.now()}_${index}`,
      text: opt,
      votes: 0
    }));

    const poll = new Poll({
      question,
      options: formattedOptions,
      created_by: req.user.user_id,
      course_id: course_id || null,
      is_active: true,
      voters: []
    });

    await poll.save();

    const savedPoll = await Poll.findOne({ poll_id: poll.poll_id }, { _id: 0 });
    return res.status(201).json(savedPoll);
  } catch (error) {
    console.error('Create poll error:', error);
    return res.status(500).json({ error: 'Failed to create poll' });
  }
});

router.post('/:poll_id/vote', verifyToken, checkPermission('STUDENT'), async (req, res) => {
  try {
    const { option_id } = req.body;

    if (!option_id) {
      return res.status(400).json({ error: 'option_id is required' });
    }

    // Atomic conditional update: only matches (and therefore only mutates)
    // a document where the user hasn't already voted, the poll is active,
    // and the option exists. This closes the read-then-write race that the
    // previous findOne -> mutate -> save pattern had under concurrent votes.
    const updatedPoll = await Poll.findOneAndUpdate(
      {
        poll_id: req.params.poll_id,
        is_active: true,
        'voters.user_id': { $ne: req.user.user_id },
        'options.option_id': option_id
      },
      {
        $inc: { 'options.$[opt].votes': 1 },
        $push: { voters: { user_id: req.user.user_id, option_id, voted_at: new Date() } }
      },
      {
        arrayFilters: [{ 'opt.option_id': option_id }],
        new: true,
        projection: { _id: 0 }
      }
    );

    if (!updatedPoll) {
      // The conditional update matched nothing - figure out why for a
      // helpful error message.
      const poll = await Poll.findOne({ poll_id: req.params.poll_id });
      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }
      if (!poll.is_active) {
        return res.status(400).json({ error: 'Poll is closed' });
      }
      if (poll.voters.some(v => v.user_id === req.user.user_id)) {
        return res.status(400).json({ error: 'You have already voted' });
      }
      return res.status(400).json({ error: 'Invalid option' });
    }

    req.io.to(`poll_${updatedPoll.poll_id}`).emit('poll_updated', updatedPoll);

    await awardPoints(req.user.user_id, POINTS.POLL_VOTE, 'Voted in a poll');

    return res.status(200).json(updatedPoll);
  } catch (error) {
    console.error('Vote error:', error);
    return res.status(500).json({ error: 'Failed to submit vote' });
  }
});

router.patch('/:poll_id/close', verifyToken, checkPermission('STUDENT', 'ADMIN'), async (req, res) => {
  try {
    const poll = await Poll.findOne({ poll_id: req.params.poll_id });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Creator may close their own poll; admins may close any.
    if (poll.created_by !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to close this poll' });
    }

    poll.is_active = false;
    poll.closed_at = new Date();
    await poll.save();

    const updatedPoll = await Poll.findOne({ poll_id: poll.poll_id }, { _id: 0 });
    
    req.io.to(`poll_${poll.poll_id}`).emit('poll_closed', updatedPoll);

    return res.status(200).json(updatedPoll);
  } catch (error) {
    console.error('Close poll error:', error);
    return res.status(500).json({ error: 'Failed to close poll' });
  }
});

export default router;
