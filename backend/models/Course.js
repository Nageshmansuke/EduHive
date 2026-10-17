import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  course_id: {
    type: String,
    default: () => `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: 'https://images.unsplash.com/photo-1758612214917-81d7956c09de'
  },
  category: {
    type: String,
    default: 'General'
  },
  instructor_id: {
    type: String,
    required: true,
    index: true
  },
  instructor_name: String,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  enrolled_students: {
    type: Number,
    default: 0
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

const Course = mongoose.model('Course', courseSchema);
export default Course;
