import mongoose from 'mongoose';

const noteCollaborationSchema = new mongoose.Schema({
  collaboration_id: {
    type: String,
    default: () => `collab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  note_id: {
    type: String,
    required: true,
    index: true
  },
  owner_id: {
    type: String,
    required: true
  },
  shared_with: {
    type: String,
    required: true
  },
  shared_with_name: String,
  permission_level: {
    type: String,
    enum: ['VIEW', 'EDIT', 'COMMENT'],
    default: 'VIEW'
  },
  created_at: {
    type: Date,
    default: () => new Date()
  },
  updated_at: {
    type: Date,
    default: () => new Date()
  }
});

const NoteCollaboration = mongoose.model('NoteCollaboration', noteCollaborationSchema);
export default NoteCollaboration;
