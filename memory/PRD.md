# Eduvi - Educational Platform PRD

## Original Problem Statement
Build Eduvi, a comprehensive, real-time Educational Platform with RBAC, Gamification, Live Polls, WebRTC Video Chat, AI Suite (Claude), and Content Management System.

## Architecture
- **Backend**: Node.js/Express (ES modules), Socket.IO, Mongoose
- **Frontend**: React 18 (CRA), TailwindCSS, Shadcn UI
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: Emergent Google OAuth (session tokens)
- **AI**: Anthropic Claude via Emergent LLM key (proxy)
- **Real-time**: Socket.IO for polls, leaderboard, WebRTC signaling

## User Personas
1. **Student** - Browse courses, view content, participate in polls, use AI assistant, earn points
2. **Teacher** - Create courses, upload content, create polls, manage video sessions
3. **Admin** - Approve/reject courses & content, manage users, full platform access

## Core Requirements
- [x] RBAC (Student/Teacher/Admin)
- [x] Google OAuth authentication
- [x] Course CRUD with approval pipeline (PENDING/APPROVED/REJECTED)
- [x] Content upload (Video/PDF/Markdown) with multer
- [x] Gamification: Points, Tiers (Bronze/Silver/Gold/Platinum)
- [x] Leaderboard: Overall/Weekly/Monthly rankings
- [x] Live Polling with real-time Socket.IO updates
- [x] WebRTC Video Classroom (basic P2P)
- [x] AI Tutor Chat (multi-turn with Claude)
- [x] AI Text Summarizer
- [x] AI Quiz Generator (MCQ)
- [x] Role-based navigation and access control

## What's Been Implemented (April 14, 2026)
### Backend (Node.js/Express)
- Full REST API with /api prefix
- 8 route modules: auth, users, courses, content, polls, leaderboard, ai, whiteboard
- Mongoose schemas: User, UserSession, Course, Content, Poll, LeaderboardEntry, ChatMessage, WhiteboardSession
- JWT-free auth via Emergent session tokens
- File upload middleware (multer)
- Socket.IO for real-time events (polls, leaderboard, whiteboard drawing)
- AI integration via Emergent proxy
- Whiteboard: session management, permission control, snapshot saving

### Frontend (React)
- 13 pages: Landing, Dashboard, Courses, CourseDetail, Leaderboard, Polls, AI Assistant, Video Classroom, Teacher Courses, Admin Approvals, Whiteboard, Study Notes, Admin Users, Admin Analytics
- Shared AppLayout with sidebar navigation (role-aware)
- Neo-brutalist design with Outfit/Manrope fonts
- Role-based routing with RoleGuard component
- Socket.IO client for real-time features (polls, whiteboard, session chat)
- HTML5 Canvas whiteboard with full drawing toolkit
- Session chat panel (real-time text chat within video/whiteboard sessions)
- Study Notes with My Notes / Community Notes filtering
- Admin User Management with role changes and deletion
- Admin Analytics dashboard with platform-wide statistics
- Fully responsive design

## P0 Remaining (Critical)
- None - all core features implemented

## P1 (Important)
- Content viewer (inline PDF/video player)
- Course enrollment tracking per student
- Quiz scoring integration with points system

## P2 (Nice to Have)
- User profile edit page
- Course progress tracking
- Notification system
- Chat within video classroom
- TURN server for production WebRTC

## Next Tasks
1. Add course enrollment and progress tracking
2. Build inline content viewer
3. Connect quiz scoring to gamification points
4. Add notification system for approvals
