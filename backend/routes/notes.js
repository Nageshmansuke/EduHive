import express from 'express';
import fs from 'fs';
import StudyNote from '../models/StudyNote.js';
import NoteCollaboration from '../models/NoteCollaboration.js';
import FileAttachment from '../models/FileAttachment.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import { upload, getPublicFileUrl, resolveUploadPath } from '../middleware/upload.js';
import { trackNoteCreated } from '../utils/gamification.js';
import { deleteNoteCascade } from '../utils/cascadeDelete.js';

const router = express.Router();

// A note is visible to: its owner, any ADMIN, anyone if it's public, or any
// user it has explicitly been shared with via NoteCollaboration. Centralized
// here since it was previously duplicated (inconsistently - some routes
// forgot the collaborator case entirely) across several handlers below.
const canViewNote = async (note, requestingUser) => {
  if (note.is_public || note.user_id === requestingUser.user_id || requestingUser.role === 'ADMIN') {
    return true;
  }
  const collab = await NoteCollaboration.findOne({ note_id: note.note_id, shared_with: requestingUser.user_id });
  return !!collab;
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const { course_id, user_id, public_only } = req.query;
    const query = {};

    if (course_id) query.course_id = course_id;

    if (public_only === 'true') {
      query.is_public = true;
    } else if (user_id) {
      // `?user_id=` was previously trusted outright, letting any caller list
      // another user's *private* notes just by passing their id. Only the
      // owner (or an admin) may see the private ones; everyone else gets
      // that user's public notes only.
      query.user_id = user_id;
      if (user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
        query.is_public = true;
      }
    } else {
      query.$or = [
        { user_id: req.user.user_id },
        { is_public: true }
      ];
    }

    const notes = await StudyNote.find(query, { _id: 0 }).sort({ updated_at: -1 });
    return res.status(200).json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    return res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// IMPORTANT: this must be registered before `GET /:note_id` - Express
// matches routes in declaration order, so with `/:note_id` first, a request
// to `/shared/with-me` would match it with note_id="shared" and 404. This
// previously made the entire "Shared with me" tab in the UI non-functional.
router.get('/shared/with-me', verifyToken, async (req, res) => {
  try {
    const collaborations = await NoteCollaboration.find(
      { shared_with: req.user.user_id },
      { _id: 0 }
    ).sort({ created_at: -1 });

    const noteIds = collaborations.map(c => c.note_id);
    const notes = await StudyNote.find({ note_id: { $in: noteIds } }, { _id: 0 });

    const result = collaborations.map(collab => {
      const note = notes.find(n => n.note_id === collab.note_id);
      return { ...collab, note };
    }).filter(item => item.note);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get shared notes error:', error);
    return res.status(500).json({ error: 'Failed to fetch shared notes' });
  }
});

router.get('/:note_id', verifyToken, async (req, res) => {
  try {
    const note = await StudyNote.findOne({ note_id: req.params.note_id }, { _id: 0 });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (!(await canViewNote(note, req.user))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return res.status(200).json(note);
  } catch (error) {
    console.error('Get note error:', error);
    return res.status(500).json({ error: 'Failed to fetch note' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, course_id, tags, is_public } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const note = new StudyNote({
      user_id: req.user.user_id,
      user_name: req.user.name,
      title,
      content: content || '',
      course_id: course_id || null,
      tags: tags || [],
      is_public: is_public || false,
      file_type: 'TEXT'
    });
    await note.save();
    await trackNoteCreated(req.user.user_id);

    const saved = await StudyNote.findOne({ note_id: note.note_id }, { _id: 0 });
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ error: 'Failed to create note' });
  }
});

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { title, course_id, is_public } = req.body;
    if (!title || !req.file) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Title and file are required' });
    }

    let fileType = 'TEXT';
    if (req.file.mimetype === 'application/pdf') fileType = 'PDF';
    else if (req.file.mimetype === 'text/markdown') fileType = 'MARKDOWN';

    const note = new StudyNote({
      user_id: req.user.user_id,
      user_name: req.user.name,
      title,
      course_id: course_id || null,
      is_public: is_public === 'true',
      file_path: req.file.path,
      file_url: getPublicFileUrl(req.file),
      file_type: fileType
    });
    await note.save();
    await trackNoteCreated(req.user.user_id);

    const saved = await StudyNote.findOne({ note_id: note.note_id }, { _id: 0 });
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Upload note error:', error);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: 'Failed to upload note' });
  }
});

router.patch('/:note_id', verifyToken, async (req, res) => {
  try {
    const note = await StudyNote.findOne({ note_id: req.params.note_id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, content, tags, is_public } = req.body;
    if (title) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags) note.tags = tags;
    if (is_public !== undefined) note.is_public = is_public;
    note.updated_at = new Date();
    await note.save();

    const updated = await StudyNote.findOne({ note_id: note.note_id }, { _id: 0 });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update note error:', error);
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:note_id', verifyToken, async (req, res) => {
  try {
    const note = await StudyNote.findOne({ note_id: req.params.note_id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { removed_attachments } = await deleteNoteCascade(req.params.note_id);
    return res.status(200).json({ message: 'Note deleted', removed_attachments });
  } catch (error) {
    console.error('Delete note error:', error);
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ===== COLLABORATION ENDPOINTS =====

router.post('/:note_id/share', verifyToken, async (req, res) => {
  try {
    const { shared_with, shared_with_name, permission_level } = req.body;
    const note = await StudyNote.findOne({ note_id: req.params.note_id });
    
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!shared_with || !shared_with_name) {
      return res.status(400).json({ error: 'Shared user ID and name required' });
    }
    if (shared_with === req.user.user_id) {
      return res.status(400).json({ error: 'Cannot share a note with yourself' });
    }

    const targetUser = await User.findOne({ user_id: shared_with });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await NoteCollaboration.findOne({
      note_id: req.params.note_id,
      shared_with: shared_with
    });

    if (existing) {
      existing.permission_level = permission_level || 'VIEW';
      existing.updated_at = new Date();
      await existing.save();
      return res.status(200).json(existing);
    }

    const collab = new NoteCollaboration({
      note_id: req.params.note_id,
      owner_id: req.user.user_id,
      shared_with,
      shared_with_name,
      permission_level: permission_level || 'VIEW'
    });
    await collab.save();
    return res.status(201).json(collab);
  } catch (error) {
    console.error('Share note error:', error);
    return res.status(500).json({ error: 'Failed to share note' });
  }
});

router.get('/:note_id/collaborators', verifyToken, async (req, res) => {
  try {
    const note = await StudyNote.findOne({ note_id: req.params.note_id });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const collaborators = await NoteCollaboration.find(
      { note_id: req.params.note_id },
      { _id: 0 }
    ).sort({ created_at: -1 });

    return res.status(200).json(collaborators);
  } catch (error) {
    console.error('Get collaborators error:', error);
    return res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

router.delete('/:note_id/share/:collab_id', verifyToken, async (req, res) => {
  try {
    const note = await StudyNote.findOne({ note_id: req.params.note_id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    if (note.user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await NoteCollaboration.deleteOne({ collaboration_id: req.params.collab_id, note_id: req.params.note_id });
    return res.status(200).json({ message: 'Share removed' });
  } catch (error) {
    console.error('Remove share error:', error);
    return res.status(500).json({ error: 'Failed to remove share' });
  }
});

// ===== FILE ATTACHMENT ENDPOINTS =====

router.post('/:note_id/attachments/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { description } = req.body;
    const note = await StudyNote.findOne({ note_id: req.params.note_id });

    if (!note) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Note not found' });
    }

    // Allow note owner or collaborators with EDIT permission
    const isOwner = note.user_id === req.user.user_id;
    let hasEditAccess = isOwner || req.user.role === 'ADMIN';

    if (!hasEditAccess) {
      const collab = await NoteCollaboration.findOne({
        note_id: req.params.note_id,
        shared_with: req.user.user_id,
        permission_level: { $in: ['EDIT'] }
      });
      hasEditAccess = !!collab;
    }

    if (!hasEditAccess) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Not authorized to add attachments' });
    }

    if (!req.file) return res.status(400).json({ error: 'File is required' });

    const attachment = new FileAttachment({
      note_id: req.params.note_id,
      uploaded_by: req.user.user_id,
      file_name: req.file.originalname,
      file_url: getPublicFileUrl(req.file),
      file_size: req.file.size,
      file_type: req.file.filename.split('.').pop(),
      mime_type: req.file.mimetype,
      description: description || ''
    });

    await attachment.save();
    return res.status(201).json(attachment);
  } catch (error) {
    console.error('Upload attachment error:', error);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

router.get('/:note_id/attachments', verifyToken, async (req, res) => {
  try {
    const note = await StudyNote.findOne({ note_id: req.params.note_id });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Previously unauthenticated-for-access: any logged-in user could list
    // (and therefore download) attachments of any private note by guessing
    // its note_id, since this route never checked the note's visibility.
    if (!(await canViewNote(note, req.user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attachments = await FileAttachment.find(
      { note_id: req.params.note_id },
      { _id: 0 }
    ).sort({ created_at: -1 });

    return res.status(200).json(attachments);
  } catch (error) {
    console.error('Get attachments error:', error);
    return res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

router.delete('/:note_id/attachments/:attachment_id', verifyToken, async (req, res) => {
  try {
    // Previously fetched by attachment_id alone, so this endpoint would
    // happily delete an attachment even if it belonged to a *different*
    // note than the one in the URL - an authorization bypass since the
    // caller only needs to own/edit *some* note to pass the checks below.
    const attachment = await FileAttachment.findOne({
      attachment_id: req.params.attachment_id,
      note_id: req.params.note_id
    });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    const note = await StudyNote.findOne({ note_id: req.params.note_id });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const isOwner = note.user_id === req.user.user_id;
    const isUploader = attachment.uploaded_by === req.user.user_id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isUploader && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await FileAttachment.deleteOne({ attachment_id: req.params.attachment_id });

    if (attachment.file_url) {
      const filePath = resolveUploadPath(attachment.file_url);
      if (filePath) fs.unlink(filePath, () => {});
    }

    return res.status(200).json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
