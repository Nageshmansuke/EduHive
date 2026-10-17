import express from 'express';
import Course from '../models/Course.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';
import { deleteCourseCascade } from '../utils/cascadeDelete.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, mine } = req.query;
    const query = {};

    // Explicit opt-in used by the "My Courses" teacher management view so it
    // doesn't share the unfiltered admin/catalog query below (previously
    // every teacher saw every other teacher's courses here).
    if (mine === 'true') {
      query.instructor_id = req.user.user_id;
    } else if (req.user.role === 'ADMIN') {
      // Only the admin approvals queue needs to see every status at once;
      // an explicit `status` filter still narrows it if provided.
      if (status) query.status = status;
    } else {
      // Both STUDENT and TEACHER hit the general public catalog here (the
      // `/courses` browse page has no role guard) - it should only ever
      // show APPROVED courses. Previously only STUDENTs were restricted,
      // so a TEACHER browsing the catalog could see every other teacher's
      // PENDING/REJECTED drafts mixed into what's meant to be a public
      // listing; that view already exists and is properly scoped via the
      // TEACHER/ADMIN-only AdminApprovals page and `mine=true` above.
      query.status = 'APPROVED';
    }

    const courses = await Course.find(query, { _id: 0 }).sort({ created_at: -1 });
    return res.status(200).json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/:course_id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findOne({ course_id: req.params.course_id }, { _id: 0 });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'APPROVED' && req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Course not available' });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error('Get course error:', error);
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
});

router.post('/', verifyToken, checkPermission('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { title, description, thumbnail, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const course = new Course({
      title,
      description,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1758612214917-81d7956c09de',
      category: category || 'General',
      instructor_id: req.user.user_id,
      instructor_name: req.user.name,
      status: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING'
    });

    await course.save();

    const savedCourse = await Course.findOne({ course_id: course.course_id }, { _id: 0 });
    return res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({ error: 'Failed to create course' });
  }
});

router.patch('/:course_id/status', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const course = await Course.findOne({ course_id: req.params.course_id });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    course.status = status;
    course.updated_at = new Date();
    await course.save();

    const updatedCourse = await Course.findOne({ course_id: course.course_id }, { _id: 0 });
    return res.status(200).json(updatedCourse);
  } catch (error) {
    console.error('Update course status error:', error);
    return res.status(500).json({ error: 'Failed to update course status' });
  }
});

router.delete('/:course_id', verifyToken, checkPermission('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const course = await Course.findOne({ course_id: req.params.course_id });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructor_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    const { removed_content } = await deleteCourseCascade(req.params.course_id);
    return res.status(200).json({ message: 'Course deleted successfully', removed_content });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
