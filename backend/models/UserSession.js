import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  session_token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: () => new Date()
  }
});

userSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const UserSession = mongoose.model('UserSession', userSessionSchema, 'user_sessions');
export default UserSession;
