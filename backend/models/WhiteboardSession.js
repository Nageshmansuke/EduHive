import mongoose from 'mongoose';

const whiteboardSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    default: () => `wb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: 'Untitled Whiteboard'
  },
  created_by: {
    type: String,
    required: true,
    index: true
  },
  creator_name: String,
  course_id: String,
  participants: [{
    user_id: String,
    name: String,
    can_draw: { type: Boolean, default: false },
    joined_at: { type: Date, default: () => new Date() }
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  // Stroke/actions history persisted so boards survive leave/rejoin/restart.
  actions: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  actions_updated_at: {
    type: Date,
    default: null
  },
  snapshot_url: String,
  created_at: {
    type: Date,
    default: () => new Date()
  }
});

const WhiteboardSession = mongoose.model('WhiteboardSession', whiteboardSessionSchema);
export default WhiteboardSession;
