import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  poll_id: {
    type: String,
    default: () => `poll_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    option_id: String,
    text: String,
    votes: { type: Number, default: 0 }
  }],
  created_by: {
    type: String,
    required: true
  },
  course_id: String,
  is_active: {
    type: Boolean,
    default: true
  },
  voters: [{
    user_id: String,
    option_id: String,
    voted_at: Date
  }],
  created_at: {
    type: Date,
    default: () => new Date()
  },
  closed_at: Date
});

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
