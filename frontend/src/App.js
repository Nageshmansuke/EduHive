import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Leaderboard from './pages/Leaderboard';
import Polls from './pages/Polls';
import VideoClassroom from './pages/VideoClassroom';
import AIAssistant from './pages/AIAssistant';
import TeacherCourses from './pages/TeacherCourses';
import AdminApprovals from './pages/AdminApprovals';
import Whiteboard from './pages/Whiteboard';
import StudyNotes from './pages/StudyNotes';
import ProgressTracking from './pages/ProgressTracking';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import SummaryPanel from './pages/SummaryPanel';
import About from './pages/About';
import RoleGuard from './components/RoleGuard';
import './App.css';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

function AppRouter() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      <Route path="/courses/:course_id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><Leaderboard /></RoleGuard></ProtectedRoute>} />
      <Route path="/polls" element={<ProtectedRoute><RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><Polls /></RoleGuard></ProtectedRoute>} />
      <Route path="/video-classroom" element={<ProtectedRoute><VideoClassroom /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/teacher/courses" element={<ProtectedRoute><RoleGuard allowedRoles={['TEACHER', 'ADMIN']}><TeacherCourses /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/approvals" element={<ProtectedRoute><RoleGuard allowedRoles={['ADMIN']}><AdminApprovals /></RoleGuard></ProtectedRoute>} />
      <Route path="/whiteboard" element={<ProtectedRoute><Whiteboard /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><StudyNotes /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><RoleGuard allowedRoles={['STUDENT']}><ProgressTracking /></RoleGuard></ProtectedRoute>} />
      <Route path="/summary" element={<ProtectedRoute><SummaryPanel /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><RoleGuard allowedRoles={['ADMIN']}><AdminUsers /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute><RoleGuard allowedRoles={['ADMIN']}><AdminAnalytics /></RoleGuard></ProtectedRoute>} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
 
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="eduhive-theme">
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRouter />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
