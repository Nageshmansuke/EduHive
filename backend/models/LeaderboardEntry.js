import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  name: String,
  picture: String,
  points: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    default: 'BRONZE'
  },
  overall_rank: Number,
  weekly_rank: Number,
  monthly_rank: Number,
  weekly_points: {
    type: Number,
    default: 0
  },
  monthly_points: {
    type: Number,
    default: 0
  },
  last_updated: {
    type: Date,
    default: () => new Date()
  }
});

leaderboardSchema.index({ points: -1 });
leaderboardSchema.index({ weekly_points: -1 });
leaderboardSchema.index({ monthly_points: -1 });

const LeaderboardEntry = mongoose.model('LeaderboardEntry', leaderboardSchema);
export default LeaderboardEntry;
