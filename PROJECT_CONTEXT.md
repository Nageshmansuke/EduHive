# PROJECT_CONTEXT.md

## Project overview

EduHive/Eduvi is a full-stack educational platform with role-based access for students, teachers, and admins. It includes course creation and approval, content uploads, live polls, leaderboards, AI tutoring tools, WebRTC video classrooms, realtime whiteboards, session chat, study notes, study groups, progress tracking, and admin analytics.

The active runtime is:

- Backend: `backend/app.js`, an Express + Socket.IO server.
- Frontend: `frontend/src/App.js`, a React single-page app.
- Database: MongoDB through Mongoose models in `backend/models`.

There is also a `backend/server.py` FastAPI scaffold, but it is not wired into the current Node/React application flow.

## Folder structure

```text
EduHive-main/
  README.md
  design_guidelines.json
  memory/
    PRD.md
  _tests/
    backend_test.py
    whiteboard_backend_test.py
    test_reports/
  backend/
    app.js
    server.py
    package.json
    requirements.txt
    config/
      database.js
    middleware/
      auth.js
      errorHandler.js
      upload.js
    models/
      ChatMessage.js
      Content.js
      Course.js
      FileAttachment.js
      LeaderboardEntry.js
      NoteCollaboration.js
      Poll.js
      SessionChat.js
      StudyGroup.js
      StudyNote.js
      User.js
      UserProgress.js
      UserSession.js
      WhiteboardSession.js
    routes/
      admin.js
      ai.js
      auth.js
      content.js
      courses.js
      leaderboard.js
      notes.js
      polls.js
      progress.js
      sessionChat.js
      studyGroups.js
      users.js
      whiteboard.js
    scripts/
      createTestData.js
    sockets/
      videoChat.js
    uploads/
      markdown/
      pdfs/
      snapshots/
      videos/
  frontend/
    package.json
    craco.config.js
    tailwind.config.js
    components.json
    public/
      index.html
    plugins/
      health-check/
    src/
      App.js
      index.js
      contexts/
        AuthContext.js
        SocketContext.js
      components/
        AppLayout.js
        ProtectedRoute.js
        RoleGuard.js
        SessionChatPanel.js
        ui/
      hooks/
        use-toast.js
      lib/
        utils.js
      pages/
```

## Tech stack

Backend:

- Node.js with ES modules.
- Express 4.
- Socket.IO 4 for realtime collaboration, polls, chat, whiteboard, and WebRTC signaling.
- MongoDB with Mongoose 8.
- JWT authentication with server-side session records.
- bcryptjs for password hashing.
- multer for file uploads.
- helmet, cors, cookie-parser, express-rate-limit.
- Google Gemini via `@google/generative-ai`, with mock fallback responses.

Frontend:

- React 19 with Create React App/react-scripts.
- React Router DOM 7.
- Axios for HTTP calls.
- Socket.IO client.
- Tailwind CSS 3.
- Radix UI/shadcn-style UI components.
- lucide-react icons.
- Recharts for charts.
- Native WebRTC APIs for video classrooms.

Python/testing/scaffold:

- `backend/server.py` is a FastAPI/Motor scaffold.
- `_tests/*.py` use `requests` against an external preview URL and older test tokens.

## Architecture

The app is a classic SPA plus API server:

1. React renders routes from `frontend/src/App.js`.
2. `AuthProvider` checks `/api/auth/me` with cookies on load.
3. Protected pages call backend REST endpoints with `withCredentials: true`.
4. `SocketProvider` opens one global Socket.IO connection to `REACT_APP_BACKEND_URL`.
5. Express in `backend/app.js` mounts REST routes under `/api/*`.
6. `handleVideoChat(io)` registers Socket.IO events for video, polls, session chat rooms, and whiteboard rooms.
7. Mongoose persists users, sessions, courses, content, notes, progress, chat messages, and collaboration metadata.
8. Uploaded files are served from `/uploads` via Express static middleware.

Important backend mount points:

- `/api/auth`
- `/api/users`
- `/api/courses`
- `/api/content`
- `/api/polls`
- `/api/leaderboard`
- `/api/ai`
- `/api/whiteboard`
- `/api/session-chat`
- `/api/notes`
- `/api/admin`
- `/api/study-groups`
- `/api/progress`

## Database schema

All schemas use string public IDs instead of exposing Mongo `_id` in normal API responses.

### User

Collection: default Mongoose `users`.

Fields:

- `user_id`: unique `user_<uuid prefix>`.
- `email`: required, unique, lowercased.
- `name`: required.
- `password`: hashed in a pre-save hook when modified.
- `picture`: avatar URL.
- `role`: `STUDENT`, `TEACHER`, or `ADMIN`.
- `points`: numeric gamification score.
- `tier`: `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`.
- `google_id`: present in schema but not used by current auth routes.
- `created_at`, `updated_at`.

Methods:

- `comparePassword(candidatePassword)`.
- `updateTier()`: BRONZE below 500, SILVER at 500, GOLD at 2000, PLATINUM at 5000.

### UserSession

Collection: `user_sessions`.

Fields:

- `user_id`
- `session_token`: unique JWT string.
- `expires_at`: TTL indexed with `expireAfterSeconds: 0`.
- `created_at`

### Course

Fields:

- `course_id`: `course_<timestamp>_<random>`.
- `title`, `description`, `thumbnail`, `category`.
- `instructor_id`, `instructor_name`.
- `status`: `PENDING`, `APPROVED`, `REJECTED`.
- `enrolled_students`.
- `created_at`, `updated_at`.

### Content

Fields:

- `content_id`
- `course_id`
- `title`, `description`
- `type`: `VIDEO`, `PDF`, `MARKDOWN`
- `file_path`, `file_url`
- `duration`, `order`
- `status`: `PENDING`, `APPROVED`, `REJECTED`
- `uploaded_by`
- `created_at`

### Poll

Fields:

- `poll_id`
- `question`
- `options`: `{ option_id, text, votes }[]`
- `created_by`
- `course_id`
- `is_active`
- `voters`: `{ user_id, option_id, voted_at }[]`
- `created_at`, `closed_at`

### LeaderboardEntry

Fields:

- `user_id`, `name`, `picture`, `tier`
- `points`, `weekly_points`, `monthly_points`
- `overall_rank`, `weekly_rank`, `monthly_rank`
- `last_updated`

Indexes sort by `points`, `weekly_points`, and `monthly_points`.

### ChatMessage

Used by the AI assistant.

Fields:

- `session_id`
- `user_id`
- `role`: `user`, `assistant`, `system`
- `content`
- `created_at`

### SessionChat

Used by video and whiteboard session chat.

Fields:

- `session_id`
- `session_type`: `video` or `whiteboard`
- `user_id`, `user_name`, `user_picture`
- `message`
- `created_at`

### WhiteboardSession

Fields:

- `session_id`
- `name`
- `created_by`, `creator_name`
- `course_id`
- `participants`: `{ user_id, name, can_draw, joined_at }[]`
- `is_active`
- `snapshot_url`
- `created_at`

Realtime drawing actions are kept in memory in `backend/sockets/videoChat.js`, not persisted to MongoDB except snapshots.

### StudyNote

Fields:

- `note_id`
- `user_id`, `user_name`
- `title`, `content`
- `course_id`
- `tags`
- `is_public`
- `file_path`, `file_url`
- `file_type`: `TEXT`, `PDF`, `MARKDOWN`, or `null`
- `created_at`, `updated_at`

### NoteCollaboration

Fields:

- `collaboration_id`
- `note_id`
- `owner_id`
- `shared_with`, `shared_with_name`
- `permission_level`: `VIEW`, `EDIT`, `COMMENT`
- `created_at`, `updated_at`

### FileAttachment

Fields:

- `attachment_id`
- `note_id`
- `uploaded_by`
- `file_name`, `file_url`, `file_size`, `file_type`, `mime_type`
- `description`
- `created_at`

### StudyGroup

Fields:

- `group_id`
- `name`, `description`, `subject`, `cover_image`
- `creator_id`, `creator_name`
- `members`: `{ user_id, user_name, role, joined_at }[]`
- `max_members`
- `is_public`
- `created_at`, `updated_at`

### UserProgress

Fields:

- `progress_id`
- `user_id`
- `course_id`
- `content_completed`: `{ content_id, completed_at, time_spent }[]`
- `quiz_attempts`: `{ quiz_id, score, total_questions, attempted_at }[]`
- `notes_created`
- `total_study_time`
- `streak_days`
- `last_activity`
- `badges`
- `created_at`, `updated_at`

## API routes

All routes below are mounted under `/api`.

### Health

- `GET /health`: service health check.

### Auth

- `POST /auth/register`: create a user, hash password through model hook, create JWT session, set `session_token` cookie.
- `POST /auth/login`: validate email/password, create JWT session, set cookie.
- `GET /auth/me`: current authenticated user.
- `POST /auth/logout`: delete current session and clear cookie.

### Users

- `GET /users/profile`: authenticated user's full profile without password.
- `PATCH /users/profile`: update `name` and/or `picture`.
- `POST /users/add-points`: add points, update user tier, upsert leaderboard entry.

### Courses

- `GET /courses`: students see only `APPROVED`; teachers/admins can use `?status=`.
- `GET /courses/:course_id`: fetch one course; students cannot view non-approved courses.
- `POST /courses`: teacher/admin create course; teacher courses start `PENDING`, admin courses start `APPROVED`.
- `PATCH /courses/:course_id/status`: admin status update.
- `DELETE /courses/:course_id`: teacher owner or admin delete.

### Content

- `GET /content/:course_id`: list course content; students see approved content only.
- `POST /content`: teacher/admin upload one file and create content.
- `PATCH /content/:content_id/status`: admin status update.

### Polls

- `GET /polls`: list polls, optional `course_id` and `is_active`.
- `GET /polls/:poll_id`: fetch one poll.
- `POST /polls`: teacher/admin create poll.
- `POST /polls/:poll_id/vote`: vote once per user; emits `poll_updated`.
- `PATCH /polls/:poll_id/close`: creator or admin close poll; emits `poll_closed`.

### Leaderboard

- `GET /leaderboard/overall`
- `GET /leaderboard/weekly`
- `GET /leaderboard/monthly`
- `POST /leaderboard/refresh`: recompute ranks and emit `leaderboard_updated`.

### AI

- `POST /ai/chat`: save user message, call Gemini or mock fallback, save assistant response.
- `POST /ai/summarize`: summarize supplied text.
- `POST /ai/generate-questions`: generate MCQ JSON.
- `GET /ai/chat/history/:session_id`: fetch current user's AI chat history for a session.

### Whiteboard

- `GET /whiteboard`: list whiteboard sessions.
- `GET /whiteboard/:session_id`: fetch one session.
- `POST /whiteboard`: teacher/admin create session.
- `PATCH /whiteboard/:session_id/permission`: teacher/admin change participant draw permission and emit `permission_changed`.
- `POST /whiteboard/:session_id/snapshot`: save base64 PNG snapshot under `uploads/snapshots`.
- `PATCH /whiteboard/:session_id/close`: teacher/admin close session and emit `whiteboard_closed`.

### Session chat

- `GET /session-chat/:session_id`: list messages for a video or whiteboard session.
- `POST /session-chat`: create a chat message and emit `new_chat_message`.

### Notes

- `GET /notes`: list notes with `course_id`, `user_id`, or `public_only=true`.
- `GET /notes/:note_id`: fetch one note with public/owner/admin access control.
- `POST /notes`: create a text note.
- `POST /notes/upload`: upload a file-backed note.
- `PATCH /notes/:note_id`: update owner/admin note fields.
- `DELETE /notes/:note_id`: delete note plus collaborations and attachments.
- `POST /notes/:note_id/share`: owner/admin share note with another user ID/name.
- `GET /notes/:note_id/collaborators`: list collaborators.
- `DELETE /notes/:note_id/share/:collab_id`: remove collaboration.
- `GET /notes/shared/with-me`: intended to list shared notes, but currently route order likely shadows it.
- `POST /notes/:note_id/attachments/upload`: owner or EDIT collaborator uploads attachment.
- `GET /notes/:note_id/attachments`: list attachments.
- `DELETE /notes/:note_id/attachments/:attachment_id`: owner or uploader delete.

### Study groups

- `POST /study-groups`: create group.
- `GET /study-groups`: list groups, optional `subject` and `is_public=true`.
- `GET /study-groups/my/groups`: list current user's groups.
- `GET /study-groups/:group_id`: fetch one group.
- `POST /study-groups/:group_id/join`
- `POST /study-groups/:group_id/leave`
- `PATCH /study-groups/:group_id`: group admin or platform admin update.
- `DELETE /study-groups/:group_id`: group admin or platform admin delete.

### Progress

- `GET /progress/user/:user_id`: user or admin fetch progress; creates record if absent.
- `POST /progress/track/content`: mark/update completed content and study time.
- `POST /progress/track/quiz`: add quiz attempt.
- `POST /progress/track/note`: increment note count.
- `POST /progress/badge`: add badge if missing.
- `GET /progress/leaderboard/global`: progress leaderboard by `total_study_time`.

### Admin

- `GET /admin/users`: admin list users.
- `PATCH /admin/users/:user_id/role`: admin change role.
- `DELETE /admin/users/:user_id`: admin delete user, except self.
- `GET /admin/analytics`: aggregate users, courses, polls, whiteboards, notes, session messages, and recent users.

## Authentication flow

Current implemented flow:

1. Landing page renders sign in/sign up forms.
2. `AuthContext.handleRegister` calls `POST /api/auth/register`.
3. `AuthContext.handleLogin` calls `POST /api/auth/login`.
4. Backend signs a JWT containing `user_id`, `email`, and `role`.
5. Backend stores the JWT in `UserSession.session_token` with a 7-day `expires_at`.
6. Backend sets `session_token` as an HTTP-only cookie with `secure: true`, `sameSite: none`, and `path: /`.
7. Frontend calls authenticated endpoints with `withCredentials: true`.
8. `verifyToken` reads cookie first, then `Authorization: Bearer ...`; verifies JWT; checks the session exists and is not expired; loads the user; assigns `req.user`.
9. `checkPermission(...roles)` enforces RBAC after `verifyToken`.
10. Logout deletes the session record and clears the cookie.

Important mismatches:

- `frontend/src/pages/AuthCallback.js` expects `POST /api/auth/session`, but `backend/routes/auth.js` does not implement it.
- `AuthCallback` redirects to `/login`, but `frontend/src/App.js` has no `/login` route; auth happens on `/`.
- `memory/PRD.md` says Google OAuth/Emergent auth and Claude AI, but current code uses email/password JWT sessions and Gemini/mock AI.

## State management

State is mostly local React state plus two Context providers:

- `AuthContext`: stores `user`, `loading`, `isAuthenticated`, `error`, and auth actions (`handleLogin`, `handleRegister`, `logout`, `checkAuth`, `updateUser`).
- `SocketContext`: creates a global Socket.IO client from `REACT_APP_BACKEND_URL` and exposes `socket` and `connected`.

Page-level state handles data lists, forms, modal visibility, and realtime room state. There is no Redux/Zustand/React Query layer.

Realtime state:

- Video participant state is in-memory in `backend/sockets/videoChat.js`.
- Whiteboard drawing actions are in-memory in a `Map` inside the Socket.IO connection handler.
- Poll and chat updates are persisted through REST routes and broadcast through Socket.IO rooms.

## Important utility functions

Backend:

- `connectDatabase()` in `backend/config/database.js`: connects Mongoose to `${MONGO_URL}/${DB_NAME}` and reuses the connection.
- `verifyToken()` in `backend/middleware/auth.js`: cookie/Bearer auth, JWT verification, session validation, user lookup.
- `checkPermission(...allowedRoles)` in `backend/middleware/auth.js`: role guard middleware.
- `errorHandler()` in `backend/middleware/errorHandler.js`: normalizes validation, upload, duplicate, and generic errors.
- `upload` in `backend/middleware/upload.js`: multer disk storage, creates upload folders, filters file types, 500MB max.
- `callAI()` and `generateMockResponse()` in `backend/routes/ai.js`: Gemini integration and fallback responses.
- `handleVideoChat(io)` in `backend/sockets/videoChat.js`: all Socket.IO event wiring.

Frontend:

- `useAuth()` in `frontend/src/contexts/AuthContext.js`: access auth state/actions.
- `useSocket()` in `frontend/src/contexts/SocketContext.js`: access global socket.
- `ProtectedRoute` in `frontend/src/components/ProtectedRoute.js`: redirects unauthenticated users to `/`.
- `RoleGuard` in `frontend/src/components/RoleGuard.js`: redirects unauthorized roles to `/dashboard`.
- `AppLayout` in `frontend/src/components/AppLayout.js`: shared sidebar/topbar and role-aware navigation.
- `cn()` in `frontend/src/lib/utils.js`: combines `clsx` and `tailwind-merge`.
- `useToast()` / `toast()` in `frontend/src/hooks/use-toast.js`: small in-memory toast store.

## Coding conventions

- Backend uses ES modules (`"type": "module"`), `import/export`, async route handlers, and Mongoose models.
- API responses generally exclude Mongo `_id` with projections like `{ _id: 0 }`.
- Public IDs are string prefixes such as `user_`, `course_`, `content_`, `poll_`, `wb_`, `note_`, `group_`, `prog_`.
- Roles are uppercase strings: `STUDENT`, `TEACHER`, `ADMIN`.
- Status values are uppercase strings: `PENDING`, `APPROVED`, `REJECTED`.
- Dates are mostly stored in explicit snake_case fields (`created_at`, `updated_at`) rather than Mongoose timestamps.
- Frontend uses functional React components and hooks.
- HTTP calls use `axios` directly inside contexts/pages, with `withCredentials: true`.
- Styling is mostly Tailwind utility classes, with a neo-brutalist visual style: heavy dark borders, hard shadows, white/sand background, indigo accents.
- Icons come from `lucide-react`.
- Components under `frontend/src/components/ui` follow shadcn/Radix-style patterns and use the `cn()` utility.

## Environment variables

Backend:

- `PORT`: Express server port. Defaults to `8001`.
- `MONGO_URL`: Mongo base URL. Defaults to `mongodb://localhost:27017`.
- `DB_NAME`: Mongo database name. Defaults to `test_database`.
- `JWT_SECRET`: JWT signing secret. Defaults to insecure `your-secret-key`.
- `CORS_ORIGINS`: comma-separated allowed origins for CORS and Socket.IO. Defaults to `*`.
- `GEMINI_API_KEY`: enables Google Gemini responses. Without it, mock AI responses are used.
- `NODE_ENV`: affects error stack output in `errorHandler`.

Frontend:

- `REACT_APP_BACKEND_URL`: required base URL for API and Socket.IO calls.
- `ENABLE_HEALTH_CHECK`: if `true`, CRACO loads custom health-check webpack/dev-server plugins.
- `NODE_ENV`: used by CRA/CRACO.

Python scaffold:

- `MONGO_URL` and `DB_NAME` are required by `backend/server.py`.
- `CORS_ORIGINS` is also read there.

## Dependencies

Backend package dependencies:

- `@google/generative-ai`
- `axios`
- `bcryptjs`
- `cookie-parser`
- `cors`
- `dotenv`
- `express`
- `express-rate-limit`
- `helmet`
- `jsonwebtoken`
- `mongoose`
- `multer`
- `socket.io`
- `uuid`

Backend Python requirements are present for the scaffold/tests, but the active backend is Node.

Frontend major dependencies:

- React, React DOM, React Router DOM, react-scripts.
- Axios.
- Socket.IO client.
- Tailwind CSS, tailwind-merge, tailwindcss-animate.
- Radix UI component packages.
- lucide-react.
- Recharts.
- react-hook-form, zod, `@hookform/resolvers`.
- sonner and custom toast components.
- date-fns.
- embla-carousel-react, vaul, cmdk, input-otp, react-day-picker, react-resizable-panels.

Lockfiles:

- There are `package-lock.json` and `yarn.lock` files at root, backend, and frontend levels. Frontend declares Yarn 1 in `packageManager`, but npm scripts are also present.

## Common workflows

### Run backend

```bash
cd backend
npm install
npm run dev
```

Backend listens on `PORT` or `8001`.

### Run frontend

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_BACKEND_URL` to the backend origin before starting the frontend.

### Create users

Use the landing page sign-up form or call `POST /api/auth/register` with:

```json
{
  "email": "student@example.com",
  "password": "password",
  "name": "Student Name",
  "role": "STUDENT"
}
```

### Teacher course workflow

1. Teacher signs up/logs in.
2. Teacher opens `/teacher/courses`.
3. Teacher creates a course through `POST /api/courses`; it starts `PENDING`.
4. Teacher uploads content through `POST /api/content`; it starts `PENDING`.
5. Admin approves course/content through status patch routes.
6. Students can then view approved courses/content.

### Student learning workflow

1. Student signs up/logs in.
2. Student browses `/courses`.
3. Student opens course details and content.
4. Student participates in `/polls`, `/video-classroom`, `/whiteboard`, `/notes`, `/study-groups`, `/ai-assistant`, and `/progress`.
5. Points can be awarded through `POST /api/users/add-points`; progress can be tracked through `/api/progress/*`.

### Admin workflow

1. Admin logs in.
2. Admin reviews courses at `/admin/approvals`.
3. Admin manages users at `/admin/users`.
4. Admin reviews platform metrics at `/admin/analytics`.

### Realtime workflow

- Poll page joins `poll_<poll_id>` rooms and listens for `poll_updated` and `poll_closed`.
- Session chat joins `chat_<session_id>` rooms and listens for `new_chat_message`.
- Video classroom joins a raw `session_id` room, then exchanges WebRTC offer/answer/ICE messages through Socket.IO.
- Whiteboard joins `wb_<session_id>` rooms and emits/listens for draw, undo, redo, clear, permission, and close events.

## Current features

- Email/password registration and login.
- JWT cookie sessions backed by a Mongo session collection.
- Role-based navigation and route guards.
- Student, teacher, and admin roles.
- Course listing, detail, creation, deletion, and approval status changes.
- Content upload for video, PDF, markdown/text.
- AI assistant chat with persistent conversation history.
- AI summarization and question generation.
- Overall, weekly, and monthly leaderboards.
- User points and tier calculation.
- Live polls with realtime vote/close events.
- WebRTC video classroom with camera/mic controls and session IDs.
- Realtime session chat.
- Realtime whiteboard with canvas actions, undo/redo/clear, participant permissions, and snapshots.
- Study notes with public/private filtering, editing, sharing metadata, and attachments.
- Study groups with create/join/leave/update/delete.
- Progress tracking for content, quizzes, notes, badges, study time.
- Admin user management.
- Admin analytics dashboard.

## Known issues

- `frontend/src/pages/AuthCallback.js` is stale: it calls `/api/auth/session`, but the backend has no such route. It also redirects to `/login`, which does not exist in `App.js`.
- `memory/PRD.md` is partly stale: it says Google OAuth/Emergent sessions and Claude, while the current code uses email/password JWT sessions and Gemini/mock AI.
- `backend/routes/notes.js` declares `GET /:note_id` before `GET /shared/with-me`, so `GET /api/notes/shared/with-me` is likely treated as note ID `shared` and returns the wrong result.
- Upload URLs are likely wrong for content, note uploads, and attachments. `upload.js` stores files in `uploads/videos`, `uploads/pdfs`, or `uploads/markdown`, but routes save `file_url` as `/uploads/${filename}` instead of `/uploads/<subfolder>/${filename}`.
- `backend/sockets/videoChat.js` listens to `leave_video_session` from the frontend, but the server does not implement a dedicated handler. Participant cleanup currently happens on socket disconnect only.
- `backend/sockets/videoChat.js` creates `whiteboardStates` and its cleanup `setInterval` inside each socket connection handler, so every connection creates a separate in-memory whiteboard state map and interval. Shared whiteboard state may not be global across sockets as intended.
- Backend startup logs and test scripts show mojibake/encoding issues for emoji characters.
- `backend/scripts/createTestData.js` is stale in several places: it expects login responses to include `token`, uses `course.name` instead of `title`, references `/admin/approvals/...` routes that do not exist, and expects IDs like `_id` or `id` instead of current `course_id`/`group_id`/`note_id`.
- `_tests/backend_test.py` and `_tests/whiteboard_backend_test.py` target an external preview URL and older hardcoded test session tokens. They may not test the local current app without updates.
- `secure: true` cookies require HTTPS in normal browsers. Local HTTP development may fail to persist auth cookies unless cookie settings or local HTTPS are handled.
- `JWT_SECRET` has an insecure fallback. Production must set a real secret.
- Course enrollment count exists, but there is no enrollment route or student-course join model.
- Content viewer and quiz scoring integration are incomplete compared with the PRD notes.

## Things that should never be changed without updating related files

- API route paths in `backend/routes/*`:
  Update every frontend page using `REACT_APP_BACKEND_URL` and matching `/api/...` calls.

- Auth cookie/session behavior:
  Update `backend/routes/auth.js`, `backend/middleware/auth.js`, `frontend/src/contexts/AuthContext.js`, `ProtectedRoute.js`, CORS settings in `backend/app.js`, and any tests that rely on cookies or Bearer tokens.

- Role names or permission rules:
  Update `User.role`, `checkPermission`, `RoleGuard`, `AppLayout` navigation, teacher/admin pages, and tests.

- Course/content status values:
  Update `Course.status`, `Content.status`, admin approval UI, teacher course badges, and student filtering logic.

- Public ID field names:
  Update backend model schemas, route lookups, frontend key props/API calls, and tests. The app uses `user_id`, `course_id`, `content_id`, `poll_id`, `note_id`, `group_id`, `session_id`, etc.

- `REACT_APP_BACKEND_URL` usage:
  All frontend API and Socket.IO connections depend on it. Do not hardcode backend URLs without updating auth, socket, deployment, and docs.

- Socket.IO event names:
  Update both `backend/sockets/videoChat.js` and corresponding frontend listeners/emitters in `Polls.js`, `VideoClassroom.js`, `Whiteboard.js`, and `SessionChatPanel.js`.

- Upload folder rules:
  Update `backend/middleware/upload.js`, static `/uploads` serving in `backend/app.js`, route `file_url` construction, frontend file links/viewers, and any cleanup/migration scripts.

- Database connection environment variables:
  Update `backend/config/database.js`, `backend/server.py` if still retained, deployment config, and setup docs.

- AI provider/model:
  Update `backend/routes/ai.js`, environment variable docs, frontend AI page expectations, and PRD/docs.

- Shared layout/navigation:
  Update `AppLayout.js`, route registration in `App.js`, `ProtectedRoute`, `RoleGuard`, and admin/teacher visibility expectations.

- Notes route ordering:
  If adding any fixed notes routes like `/shared/with-me`, place them before `/:note_id` and update `StudyNotes.js` plus tests.

- Lockfile/package-manager choice:
  Because npm and Yarn lockfiles both exist, standardize intentionally before regenerating lockfiles or changing dependency installation workflows.
