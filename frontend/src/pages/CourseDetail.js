import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Video,
  FileText,
  File,
  Users,
  GraduationCap,
  CheckCircle2,
  Loader2,
  Play,
  Clock,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const CONTENT_STYLES = {
  VIDEO: { icon: Video, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  PDF: { icon: FileText, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  MARKDOWN: { icon: File, color: 'text-teal-600 bg-teal-500/10 border-teal-500/20' },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } }
};

const CourseDetail = () => {
  const { course_id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContent, setActiveContent] = useState(null);
  const [markdownText, setMarkdownText] = useState('');
  const [markdownLoading, setMarkdownLoading] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());
  const viewStartRef = useRef(null);

  const fetchCourseData = useCallback(async () => {
    try {
      const [courseRes, contentRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses/${course_id}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/content/${course_id}`, { withCredentials: true })
      ]);
      setCourse(courseRes.data);
      setContents(contentRes.data);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  }, [course_id]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const trackCompletion = useCallback(async (contentId, timeSpentSeconds) => {
    if (user?.role !== 'STUDENT') return;
    try {
      await axios.post(
        `${API_URL}/api/progress/track/content`,
        { content_id: contentId, time_spent: Math.max(1, Math.round(timeSpentSeconds || 0)) },
        { withCredentials: true }
      );
      setCompletedIds((prev) => new Set(prev).add(contentId));
    } catch (error) {
      console.error('Failed to track content progress:', error);
    }
  }, [user?.role]);

  const openContent = (content) => {
    setActiveContent(content);
    viewStartRef.current = Date.now();

    if (content.type === 'MARKDOWN') {
      setMarkdownLoading(true);
      setMarkdownText('');
      axios.get(`${API_URL}${content.file_url}`, { withCredentials: true, responseType: 'text' })
        .then((res) => setMarkdownText(typeof res.data === 'string' ? res.data : JSON.stringify(res.data)))
        .catch(() => setMarkdownText('Unable to load this study note right now.'))
        .finally(() => setMarkdownLoading(false));
      trackCompletion(content.content_id, 5);
    } else if (content.type === 'PDF') {
      trackCompletion(content.content_id, 5);
    }
  };

  const closeContent = (open) => {
    if (open) return;
    if (activeContent && viewStartRef.current) {
      const elapsedSeconds = (Date.now() - viewStartRef.current) / 1000;
      if (activeContent.type === 'VIDEO' && elapsedSeconds >= 3) {
        trackCompletion(activeContent.content_id, elapsedSeconds);
      }
    }
    viewStartRef.current = null;
    setActiveContent(null);
    setMarkdownText('');
  };

  const getContentStyle = (type) => CONTENT_STYLES[type] || { icon: File, color: 'text-primary bg-primary/10 border-primary/20' };

  if (loading) {
    return (
      <AppLayout title="Course Detail">
        <LoadingState label="Loading course materials..." />
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout title="Course Not Found">
        <EmptyState
          icon={GraduationCap}
          title="Course not found"
          description="This course may have been removed or is pending approval."
          action={<Link to="/courses" className="text-primary font-semibold font-body hover:underline">Back to courses</Link>}
        />
      </AppLayout>
    );
  }

  const completedCount = contents.filter((c) => completedIds.has(c.content_id)).length;
  const progressPercent = contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

  return (
    <AppLayout title={course.title}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary font-heading transition-colors group"
          data-testid="back-to-courses"
        >
          <ArrowLeft size={15} strokeWidth={2} className="transition-transform duration-150 group-hover:-translate-x-1" />
          <span>Back to Course Catalog</span>
        </Link>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="eh-card-glow rounded-3xl overflow-hidden shadow-lift border border-border"
        >
          <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/15">
                {course.category}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                  course.status === 'APPROVED'
                    ? 'bg-emerald-500/80 text-white'
                    : course.status === 'PENDING'
                    ? 'bg-amber-500/80 text-black'
                    : 'bg-rose-500/80 text-white'
                }`}
              >
                {course.status}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h1
              className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground mb-3"
              data-testid="course-title"
            >
              {course.title}
            </h1>
            <p className="text-sm font-body text-muted-foreground leading-relaxed mb-6 max-w-3xl">
              {course.description}
            </p>

            {/* Course Meta & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users size={15} strokeWidth={2} />
                  <span className="text-foreground font-bold">{course.enrolled_students || 0}</span> students enrolled
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <GraduationCap size={16} strokeWidth={2} />
                  <span>Instructor: <strong className="text-foreground">{course.instructor_name}</strong></span>
                </span>
              </div>

              {user?.role === 'STUDENT' && contents.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-foreground font-heading">
                      {completedCount} / {contents.length} Complete
                    </span>
                    <p className="text-[10px] text-muted-foreground font-body">{progressPercent}% Mastered</p>
                  </div>
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Course Curriculum List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="eh-section-title">Curriculum & Materials</h2>
              <p className="text-xs text-muted-foreground">Click any lesson item to open the interactive viewer</p>
            </div>
            <span className="eh-badge-honey text-xs font-bold">
              {contents.length} Lessons Available
            </span>
          </div>

          {contents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No materials published yet"
              description="The instructor has not uploaded lecture files to this course yet."
            />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="eh-card-glow rounded-2xl overflow-hidden shadow-lift-sm divide-y divide-border/60"
            >
              {contents.map((content, index) => {
                const style = getContentStyle(content.type);
                const Icon = style.icon;
                const isDone = completedIds.has(content.content_id);
                return (
                  <motion.button
                    key={content.content_id}
                    type="button"
                    variants={itemVariants}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => openContent(content)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors group"
                    data-testid={`content-item-${index}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${style.color}`}>
                          <Icon size={18} strokeWidth={2} />
                        </span>
                        {isDone && (
                          <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white ring-2 ring-card shadow-lift-sm">
                            <CheckCircle2 size={12} strokeWidth={2.8} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold font-heading text-foreground group-hover:text-primary transition-colors truncate">
                          {content.title}
                        </p>
                        {content.description && (
                          <p className="text-xs font-body text-muted-foreground truncate mt-0.5">
                            {content.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {isDone && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          +10 XP Earned
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border">
                        {content.type}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Modern Content Viewer Modal */}
      <Dialog open={!!activeContent} onOpenChange={closeContent}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[88vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-lift-lg border-border bg-card">
          <DialogHeader className="px-6 py-4 border-b border-border text-left flex flex-row items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Interactive Viewer • {activeContent?.type}
              </span>
              <DialogTitle
                className="text-lg font-bold font-heading text-foreground mt-0.5"
                data-testid="content-viewer-title"
              >
                {activeContent?.title}
              </DialogTitle>
            </div>
            {user?.role === 'STUDENT' && (
              <span className="eh-badge-teal text-[10px] hidden sm:inline-flex">
                <CheckCircle2 size={12} /> Auto-Tracks Progress
              </span>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
            <AnimatePresence mode="wait">
              {activeContent?.type === 'VIDEO' && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                  className="rounded-xl overflow-hidden bg-black shadow-lift"
                >
                  <video
                    key={activeContent.content_id}
                    src={`${API_URL}${activeContent.file_url}`}
                    controls
                    autoPlay
                    className="w-full max-h-[65vh]"
                    data-testid="content-viewer-video"
                  />
                </motion.div>
              )}
              {activeContent?.type === 'PDF' && (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                >
                  <iframe
                    key={activeContent.content_id}
                    src={`${API_URL}${activeContent.file_url}`}
                    title={activeContent.title}
                    className="w-full h-[65vh] rounded-xl bg-card border border-border shadow-lift"
                    data-testid="content-viewer-pdf"
                  />
                </motion.div>
              )}
              {activeContent?.type === 'MARKDOWN' && (
                <motion.div
                  key="markdown"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                >
                  {markdownLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="text-xs text-muted-foreground font-body">Loading study notes…</p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-card border border-border p-6 shadow-lift text-sm font-body text-foreground leading-relaxed whitespace-pre-wrap break-words">
                      <pre
                        className="font-body text-sm text-foreground whitespace-pre-wrap break-words"
                        data-testid="content-viewer-markdown"
                      >
                        {markdownText}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CourseDetail;
