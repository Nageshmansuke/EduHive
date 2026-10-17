import mongoose from 'mongoose';

const sessionChatSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true
  },
  session_type: {
    type: String,
    enum: ['video', 'whiteboard'],
    default: 'video'
  },
  user_id: {
    type: String,
    required: true
  },
  user_name: String,
  user_picture: String,
  message: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: () => new Date()
  }
});

sessionChatSchema.index({ session_id: 1, created_at: 1 });

const SessionChat = mongoose.model('SessionChat', sessionChatSchema);
export default SessionChat;
