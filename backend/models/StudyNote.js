import mongoose from 'mongoose';

const studyNoteSchema = new mongoose.Schema({
  note_id: {
    type: String,
    default: () => `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  user_name: String,
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  course_id: String,
  tags: [String],
  is_public: {
    type: Boolean,
    default: false
  },
  file_path: String,
  file_url: String,
  file_type: {
    type: String,
    enum: ['TEXT', 'PDF', 'MARKDOWN', null],
    default: 'TEXT'
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

const StudyNote = mongoose.model('StudyNote', studyNoteSchema);
export default StudyNote;
