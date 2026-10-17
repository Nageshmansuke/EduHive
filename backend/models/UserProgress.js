import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  progress_id: {
    type: String,
    default: () => `prog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  course_id: String,
  content_completed: [{
    content_id: String,
    completed_at: Date,
    time_spent: Number
  }],
  quiz_attempts: [{
    quiz_id: String,
    score: Number,
    total_questions: Number,
    attempted_at: Date
  }],
  notes_created: {
    type: Number,
    default: 0
  },
  total_study_time: {
    type: Number,
    default: 0
  },
  streak_days: {
    type: Number,
    default: 0
  },
  last_activity: Date,
  badges: [String],
  created_at: {
    type: Date,
    default: () => new Date()
  },
  updated_at: {
    type: Date,
    default: () => new Date()
  }
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
export default UserProgress;
