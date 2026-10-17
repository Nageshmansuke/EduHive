import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'eduhive-uploads')
  : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

['videos', 'pdfs', 'markdown', 'attachments'].forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Browsers/OSes are inconsistent about the MIME type reported for markdown
// files (often `text/plain` or even `application/octet-stream`), so folder
// routing considers the file extension too instead of trusting mimetype
// alone - this is what previously misfiled markdown/text uploads into the
// `videos/` directory.
const resolveFolder = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' || ext === '.pdf') return 'pdfs';
  if (file.mimetype === 'text/markdown' || ext === '.md' || ext === '.markdown') return 'markdown';
  if (file.mimetype === 'text/plain' && ext !== '.md' && ext !== '.markdown') return 'markdown';
  return 'videos';
};

// Strips directory components and any character that isn't safe in a URL
// path segment, preventing path traversal / injection via originalname
// (e.g. "../../evil.sh" or names containing control characters).
const sanitizeFilename = (originalname) => {
  const base = path.basename(originalname);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-150) || 'file';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = resolveFolder(file);
    file.uploadFolder = folder;
    cb(null, path.join(uploadsDir, folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${sanitizeFilename(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/markdown',
    'text/plain'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.mp4', '.webm', '.pdf', '.md', '.markdown', '.txt'];

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only mp4, webm, pdf, and markdown/text files are allowed.');
    error.status = 400;
    cb(error);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

// Builds the public `/uploads/...` URL for a file multer just saved,
// derived from its actual location on disk so it can never drift from the
// folder-routing logic above.
export const getPublicFileUrl = (file) => {
  const relative = path.relative(uploadsDir, file.path).split(path.sep).join('/');
  return `/uploads/${relative}`;
};

// Inverse of getPublicFileUrl - resolves a stored `/uploads/...` URL back to
// an absolute path on disk so callers can unlink the file on delete, while
// guarding against path traversal (e.g. a corrupted/crafted URL containing
// "..") escaping the uploads directory.
export const resolveUploadPath = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) return null;
  const relative = fileUrl.slice('/uploads/'.length);
  const resolved = path.resolve(uploadsDir, relative);
  if (!resolved.startsWith(uploadsDir)) return null;
  return resolved;
};
