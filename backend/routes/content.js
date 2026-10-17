import express from 'express';
import fs from 'fs';
import Content from '../models/Content.js';
import Course from '../models/Course.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';
import { upload, getPublicFileUrl } from '../middleware/upload.js';

const router = express.Router();

router.get('/:course_id', verifyToken, async (req, res) => {
  try {
    const query = { course_id: req.params.course_id };
    
    if (req.user.role === 'STUDENT') {
      query.status = 'APPROVED';
    }

    const contents = await Content.find(query, { _id: 0 }).sort({ order: 1, created_at: 1 });
    return res.status(200).json(contents);
  } catch (error) {
    console.error('Get content error:', error);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.post('/', verifyToken, checkPermission('TEACHER', 'ADMIN'), upload.single('file'), async (req, res) => {
  try {
    const { course_id, title, description, type, order } = req.body;

    if (!course_id || !title || !type || !req.file) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Missing required fields or file' });
    }

    const course = await Course.findOne({ course_id });
    if (!course) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Course not found' });
    }

    // Only the course's own instructor (or a platform admin) may add content
    // to it - previously any TEACHER could upload into any course_id.
    if (course.instructor_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Not authorized to add content to this course' });
    }

    if (!['VIDEO', 'PDF', 'MARKDOWN'].includes(type.toUpperCase())) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Type must be one of VIDEO, PDF, MARKDOWN' });
    }

    const content = new Content({
      course_id,
      title,
      description,
      type: type.toUpperCase(),
      file_path: req.file.path,
      file_url: getPublicFileUrl(req.file),
      order: order || 0,
      uploaded_by: req.user.user_id,
      status: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING'
    });

    await content.save();

    const savedContent = await Content.findOne({ content_id: content.content_id }, { _id: 0 });
    return res.status(201).json(savedContent);
  } catch (error) {
    console.error('Upload content error:', error);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: 'Failed to upload content' });
  }
});

router.delete('/:content_id', verifyToken, checkPermission('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const content = await Content.findOne({ content_id: req.params.content_id });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.uploaded_by !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this content' });
    }

    await Content.deleteOne({ content_id: req.params.content_id });

    if (content.file_path) {
      fs.unlink(content.file_path, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Failed to remove content file:', err.message);
      });
    }

    return res.status(200).json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    return res.status(500).json({ error: 'Failed to delete content' });
  }
});

router.patch('/:content_id/status', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const content = await Content.findOne({ content_id: req.params.content_id });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    content.status = status;
    await content.save();

    const updatedContent = await Content.findOne({ content_id: content.content_id }, { _id: 0 });
    return res.status(200).json(updatedContent);
  } catch (error) {
    console.error('Update content status error:', error);
    return res.status(500).json({ error: 'Failed to update content status' });
  }
});

export default router;
