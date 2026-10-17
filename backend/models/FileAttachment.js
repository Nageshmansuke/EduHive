import mongoose from 'mongoose';

const fileAttachmentSchema = new mongoose.Schema({
  attachment_id: {
    type: String,
    default: () => `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    unique: true,
    index: true
  },
  note_id: {
    type: String,
    required: true,
    index: true
  },
  uploaded_by: {
    type: String,
    required: true
  },
  file_name: {
    type: String,
    required: true
  },
  file_url: {
    type: String,
    required: true
  },
  file_size: Number,
  file_type: String,
  mime_type: String,
  description: String,
  created_at: {
    type: Date,
    default: () => new Date()
  }
});

const FileAttachment = mongoose.model('FileAttachment', fileAttachmentSchema);
export default FileAttachment;
