import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  BookOpen,
  Upload,
  Check,
  Clock,
  XCircle,
  UploadCloud,
  FileUp,
  Users,
  Video,
  FileText,
  File,
  Sparkles,
  ChevronDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } }
};

const STATUS_CONFIG = {
  APPROVED: {
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    icon: Check
  },
  PENDING: {
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: Clock
  },
  REJECTED: {
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    icon: XCircle
  }
};

const TeacherCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showUploadContent, setShowUploadContent] = useState(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: 'General', thumbnail: '' });
  const [newContent, setNewContent] = useState({ title: '', description: '', type: 'VIDEO', file: null });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/courses?mine=true`, { withCredentials: true });
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.description) return;
    setCreating(true);
    try {
      const res = await axios.post(`${API_URL}/api/courses`, newCourse, { withCredentials: true });
      setCourses([res.data, ...courses]);
      setNewCourse({ title: '', description: '', category: 'General', thumbnail: '' });
      setShowCreateCourse(false);
    } catch (error) {
      console.error('Failed to create course:', error);
      alert(error.response?.data?.error || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadContent = async (courseId) => {
    if (!newContent.title || !newContent.file) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('course_id', courseId);
      formData.append('title', newContent.title);
      formData.append('description', newContent.description);
      formData.append('type', newContent.type);
      formData.append('file', newContent.file);

      await axios.post(`${API_URL}/api/content`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewContent({ title: '', description: '', type: 'VIDEO', file: null });
      setShowUploadContent(null);
      alert('Content uploaded successfully! Awaiting admin moderation.');
    } catch (error) {
      console.error('Failed to upload content:', error);
      alert(error.response?.data?.error || 'Failed to upload content');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = c.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-heading ${c.className}`}
      >
        <Icon size={12} strokeWidth={2.4} />
        <span>{status}</span>
      </span>
    );
  };

  const categories = [
    'General',
    'Programming',
    'Data Science',
    'Web Development',
    'Mathematics',
    'Science',
    'Design'
  ];

  const acceptFor = (type) =>
    type === 'VIDEO' ? '.mp4,.webm' : type === 'PDF' ? '.pdf' : '.md,.txt';

  return (
    <AppLayout title="My Courses">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="eh-badge-honey text-[10px]">Teaching Portal</span>
              <span className="text-xs text-muted-foreground">• Instructor Studio</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="teacher-courses-title"
            >
              Curriculum Management
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-body mt-1">
              Author courses, upload video/PDF/markdown lessons, and track enrollment.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateCourse(!showCreateCourse)}
            data-testid="create-course-button"
            className="eh-btn-primary self-start sm:self-auto h-11 px-5 rounded-xl text-xs font-bold shadow-lift-sm"
          >
            <Plus size={16} strokeWidth={2.2} />
            <span>New Course</span>
          </motion.button>
        </motion.div>

        {/* Create Course Form */}
        <AnimatePresence>
          {showCreateCourse && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="eh-card-glow rounded-2xl p-6 sm:p-7 shadow-lift border border-border"
              data-testid="create-course-form"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="eh-section-title">Draft a New Course</h3>
                <span className="text-xs text-muted-foreground font-body">Starts in Pending approval state</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 font-heading">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Modern Full-Stack Systems with Next.js"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    data-testid="course-title-input"
                    className="eh-input rounded-xl py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 font-heading">
                    Course Description *
                  </label>
                  <textarea
                    placeholder="Describe the learning objectives, prerequisites, and what students will build..."
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    data-testid="course-description-input"
                    className="eh-input rounded-xl h-28 resize-none py-2.5 text-sm leading-relaxed"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 font-heading">
                      Category
                    </label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                      data-testid="course-category-select"
                      className="eh-input rounded-xl py-2.5 text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 font-heading">
                      Thumbnail Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={newCourse.thumbnail}
                      onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                      className="eh-input rounded-xl py-2.5 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2.5 pt-2 border-t border-border/50">
                  <button
                    onClick={() => setShowCreateCourse(false)}
                    className="eh-btn-ghost h-10 px-4 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreateCourse}
                    disabled={creating || !newCourse.title || !newCourse.description}
                    data-testid="submit-course-button"
                    className="eh-btn-primary h-10 px-5 text-xs font-bold rounded-xl shadow-lift-sm disabled:opacity-50"
                  >
                    {creating ? 'Creating Course…' : 'Publish for Approval'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Courses List */}
        {loading ? (
          <LoadingState label="Loading your published courses..." />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses created yet"
            description="Create your first course to begin uploading lecture videos and PDFs for your cohort."
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {courses.map((course) => (
              <motion.div
                key={course.course_id}
                variants={cardVariants}
                data-testid={`teacher-course-${course.course_id}`}
                className="eh-card-glow rounded-2xl overflow-hidden shadow-lift-sm border border-border"
              >
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4">
                  <img
                    src={course.thumbnail}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover shrink-0 ring-1 ring-border bg-slate-900"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold font-heading text-foreground">
                        {course.title}
                      </h3>
                      {getStatusBadge(course.status)}
                    </div>
                    <p className="text-xs font-body text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex items-center flex-wrap gap-3 text-xs font-body text-muted-foreground">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider text-[10px]">
                        {course.category}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users size={13} strokeWidth={1.8} />
                        <span className="text-foreground font-bold">{course.enrolled_students || 0}</span> students
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      setShowUploadContent(
                        showUploadContent === course.course_id ? null : course.course_id
                      )
                    }
                    data-testid={`upload-content-${course.course_id}`}
                    className="eh-btn-outline shrink-0 self-start h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Upload size={14} strokeWidth={2} />
                    <span>Upload Material</span>
                  </motion.button>
                </div>

                {/* Upload Material Drawer */}
                <AnimatePresence>
                  {showUploadContent === course.course_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: easeOut }}
                      className="border-t border-border bg-muted/40 overflow-hidden"
                    >
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                            <FileUp size={16} className="text-primary" />
                            Upload Lesson Material to Course
                          </h4>
                          <span className="text-[11px] text-muted-foreground">Supports Video, PDF, Markdown</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1 font-heading">
                              Lesson Title *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Module 1: System Design Fundamentals"
                              value={newContent.title}
                              onChange={(e) =>
                                setNewContent({ ...newContent, title: e.target.value })
                              }
                              data-testid="content-title-input"
                              className="eh-input rounded-xl py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1 font-heading">
                              Content Type *
                            </label>
                            <select
                              value={newContent.type}
                              onChange={(e) =>
                                setNewContent({ ...newContent, type: e.target.value })
                              }
                              data-testid="content-type-select"
                              className="eh-input rounded-xl py-2 text-xs"
                            >
                              <option value="VIDEO">Video Lecture (.mp4, .webm)</option>
                              <option value="PDF">PDF Slides & Reading (.pdf)</option>
                              <option value="MARKDOWN">Markdown Notes (.md, .txt)</option>
                            </select>
                          </div>
                        </div>

                        {/* File Dropzone */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <label className="relative flex-1 flex items-center gap-3 border border-dashed border-border rounded-xl px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors bg-card">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                              <UploadCloud size={17} strokeWidth={2} />
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-bold font-body text-foreground truncate block">
                                {newContent.file ? newContent.file.name : 'Click to select file or drag here'}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                Maximum file size: 25MB • Formats: {acceptFor(newContent.type)}
                              </span>
                            </div>
                            <input
                              type="file"
                              onChange={(e) =>
                                setNewContent({ ...newContent, file: e.target.files[0] })
                              }
                              data-testid="content-file-input"
                              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                              accept={acceptFor(newContent.type)}
                            />
                          </label>

                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleUploadContent(course.course_id)}
                            disabled={creating || !newContent.title || !newContent.file}
                            data-testid="submit-content-button"
                            className="eh-btn-primary shrink-0 h-11 px-6 rounded-xl text-xs font-bold shadow-lift-sm disabled:opacity-50"
                          >
                            {creating ? 'Uploading…' : 'Upload Lesson'}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default TeacherCourses;
