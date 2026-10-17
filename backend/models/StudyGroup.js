import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema({
  group_id: {
    type: String,
    default: () => `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  creator_id: {
    type: String,
    required: true
  },
  creator_name: String,
  members: [{
    user_id: String,
    user_name: String,
    role: {
      type: String,
      enum: ['ADMIN', 'MEMBER'],
      default: 'MEMBER'
    },
    joined_at: Date
  }],
  subject: String,
  max_members: {
    type: Number,
    default: 50
  },
  is_public: {
    type: Boolean,
    default: false
  },
  cover_image: String,
  created_at: {
    type: Date,
    default: () => new Date()
  },
  updated_at: {
    type: Date,
    default: () => new Date()
  }
});

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
export default StudyGroup;
