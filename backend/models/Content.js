import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  content_id: {
    type: String,
    default: () => `content_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  course_id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['VIDEO', 'PDF', 'MARKDOWN'],
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  file_url: String,
  duration: Number,
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  uploaded_by: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: () => new Date()
  }
});

const Content = mongoose.model('Content', contentSchema);
export default Content;
