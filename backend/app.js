import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
 
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';
import { handleVideoChat } from './sockets/videoChat.js';
import { uploadsDir } from './middleware/upload.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import contentRoutes from './routes/content.js';
import pollRoutes from './routes/polls.js';
import leaderboardRoutes from './routes/leaderboard.js';
import aiRoutes from './routes/ai.js';
import whiteboardRoutes from './routes/whiteboard.js';
import sessionChatRoutes from './routes/sessionChat.js';
import notesRoutes from './routes/notes.js';
import adminRoutes from './routes/admin.js';
import progressRoutes from './routes/progress.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// Fail fast in production if critical secrets were left at insecure defaults.
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key')) {
  console.error('FATAL: JWT_SECRET is not set (or uses the insecure default) in production.');
  process.exit(1);
}

// CORS origin list. Defaults to the local CRA dev server when unset so the
// app works out of the box; must be set explicitly (comma-separated) in prod.
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:3000'];

// Same-deployment Vercel URLs so preview/production frontend origins are allowed
// without a second deploy after the first URL is assigned.
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
}
if (process.env.VERCEL_BRANCH_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
}

const corsOriginHandler = (origin, callback) => {
  // Allow non-browser requests (no Origin header, e.g. curl/health checks).
  if (!origin || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
};

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// Tighter limiter specifically for auth endpoints to slow down credential
// stuffing / brute-force attempts without affecting normal API usage.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.'
});

// AI routes proxy to a metered/costly external API (or do heavier local
// work in mock mode) - a dedicated limiter keeps a single user/IP from
// running up API costs or starving other requests.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many AI requests, please slow down and try again shortly.'
});

app.use(limiter);
app.use(express.json({ limit: process.env.BODY_LIMIT || '15mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '15mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'Eduvi Backend',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/whiteboard', whiteboardRoutes);
app.use('/api/session-chat', sessionChatRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/progress', progressRoutes);

io.use(socketAuthMiddleware);
handleVideoChat(io);

app.use(errorHandler);

const PORT = process.env.PORT || 8001;
const HOST = '0.0.0.0';

const startServer = async () => {
  try {
    await connectDatabase();
    
    httpServer.listen(PORT, HOST, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Eduvi Backend Server Started`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📡 HTTP Server:     http://${HOST}:${PORT}`);
      console.log(`🔌 Socket.IO:       Ready for real-time connections`);
      console.log(`🗄️  MongoDB:         Connected`);
      console.log(`🤖 AI Service:      ${process.env.GEMINI_API_KEY ? 'Google Gemini API' : 'Mock mode (no GEMINI_API_KEY set)'}`);
      console.log(`🔐 Auth:            JWT (email/password)`);
      console.log(`🌍 CORS Origins:    ${allowedOrigins.join(', ')}`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

if (process.env.VERCEL) {
  // Connect in the background so a DB blip does not crash the whole function.
  connectDatabase().catch((error) => {
    console.error('Failed to connect database:', error);
  });
} else {
  startServer();
}

export default app;
