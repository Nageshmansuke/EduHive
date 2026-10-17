import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    default: () => `user_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  picture: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  },
  role: {
    type: String,
    enum: ['STUDENT', 'TEACHER', 'ADMIN'],
    default: 'STUDENT'
  },
  points: {
    type: Number,
    default: 0
  },
  // Achievement tiers are student-only. Teachers/admins keep null so they
  // are never treated as Bronze/Silver/Gold competitors by default.
  tier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', null],
    default: null
  },
  google_id: String,
  created_at: {
    type: Date,
    default: () => new Date()
  },
  updated_at: {
    type: Date,
    default: () => new Date()
  }
}, { timestamps: false });

userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updated_at = new Date();
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateTier = function() {
  // Only students participate in the points/tier progression.
  if (this.role !== 'STUDENT') {
    this.tier = null;
    return;
  }
  const points = this.points;
  if (points >= 5000) this.tier = 'PLATINUM';
  else if (points >= 2000) this.tier = 'GOLD';
  else if (points >= 500) this.tier = 'SILVER';
  else this.tier = 'BRONZE';
};

const User = mongoose.model('User', userSchema);
export default User;
