import fs from 'fs';
import Course from '../models/Course.js';
import Content from '../models/Content.js';
import StudyNote from '../models/StudyNote.js';
import NoteCollaboration from '../models/NoteCollaboration.js';
import FileAttachment from '../models/FileAttachment.js';
import StudyGroup from '../models/StudyGroup.js';
import UserProgress from '../models/UserProgress.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import UserSession from '../models/UserSession.js';
import { resolveUploadPath } from '../middleware/upload.js';

const unlinkQuiet = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('Failed to remove file:', filePath, err.message);
  });
};

/**
 * Deletes a course, its content items, and their physical files.
 * Shared by routes/courses.js (owner-initiated delete) and the admin
 * user-deletion cascade below, so the two paths can't drift.
 */
export const deleteCourseCascade = async (course_id) => {
  const orphanedContent = await Content.find({ course_id });
  await Content.deleteMany({ course_id });
  orphanedContent.forEach((item) => unlinkQuiet(item.file_path));
  await Course.deleteOne({ course_id });
  return { removed_content: orphanedContent.length };
};

/**
 * Deletes a note, its collaborations/attachments, and their physical files.
 * Shared by routes/notes.js (owner-initiated delete) and the admin
 * user-deletion cascade below.
 */
export const deleteNoteCascade = async (note_id) => {
  const note = await StudyNote.findOne({ note_id });
  const orphanedAttachments = await FileAttachment.find({ note_id });

  await StudyNote.deleteOne({ note_id });
  await NoteCollaboration.deleteMany({ note_id });
  await FileAttachment.deleteMany({ note_id });

  if (note?.file_url) unlinkQuiet(resolveUploadPath(note.file_url));
  orphanedAttachments.forEach((att) => unlinkQuiet(resolveUploadPath(att.file_url)));

  return { removed_attachments: orphanedAttachments.length };
};

/**
 * Full cleanup for a deleted user account (admin-initiated). Historical
 * activity records that other users depend on for context (poll votes,
 * session chat messages, AI chat history) are intentionally left in place
 * with the user_id as-is - deleting them would corrupt other users' view of
 * shared history (e.g. a poll's vote counts, a session's chat transcript).
 * What we do clean up is:
 *  - resources the user exclusively owns (their courses, their notes) via
 *    the same cascades used when a user deletes their own resource
 *  - group memberships (a ghost member entry would occupy a capacity slot
 *    forever with no way for anyone to remove it)
 *  - purely account-scoped rows that become meaningless once the account
 *    is gone (active sessions, progress doc, leaderboard entry)
 */
export const deleteUserCascade = async (user_id) => {
  const ownedCourses = await Course.find({ instructor_id: user_id }, { course_id: 1 });
  for (const course of ownedCourses) {
    await deleteCourseCascade(course.course_id);
  }

  const ownedNotes = await StudyNote.find({ user_id }, { note_id: 1 });
  for (const note of ownedNotes) {
    await deleteNoteCascade(note.note_id);
  }

  // Also drop any note-sharing grants where this user was the recipient.
  await NoteCollaboration.deleteMany({ shared_with: user_id });

  await StudyGroup.updateMany(
    { 'members.user_id': user_id },
    { $pull: { members: { user_id } } }
  );

  await UserProgress.deleteOne({ user_id });
  await LeaderboardEntry.deleteOne({ user_id });
  await UserSession.deleteMany({ user_id });

  return {
    removed_courses: ownedCourses.length,
    removed_notes: ownedNotes.length
  };
};
