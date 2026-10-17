import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  FileText,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  User,
  Calendar,
  Tag
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeOut } }
};

const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [pendingCourses, setPendingCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setAllCourses(res.data);
      setPendingCourses(res.data.filter(c => c.status === 'PENDING'));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAction = async (courseId, status) => {
    setProcessing(courseId);
    try {
      await axios.patch(`${API_URL}/api/courses/${courseId}/status`, { status }, { withCredentials: true });
      await fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.error || 'Failed to update');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusConfig = (status) => ({
    APPROVED: {
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      icon: CheckCircle,
      label: 'Approved'
    },
    PENDING: {
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      icon: Clock,
      label: 'Pending Review'
    },
    REJECTED: {
      className: 'bg-destructive/10 text-destructive border border-destructive/20',
      icon: XCircle,
      label: 'Rejected'
    }
  }[status] || {
    className: 'bg-muted text-muted-foreground border border-border',
    icon: Clock,
    label: status
  });

  const statTiles = [
    {
      label: 'Pending Review',
      value: pendingCourses.length,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Approved Courses',
      value: allCourses.filter(c => c.status === 'APPROVED').length,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Rejected Drafts',
      value: allCourses.filter(c => c.status === 'REJECTED').length,
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/20'
    }
  ];

  const tabs = [
    { id: 'courses', label: 'Pending Review', count: pendingCourses.length, icon: Clock },
    { id: 'all', label: 'All Courses', count: allCourses.length, icon: FileText }
  ];

  const visibleCourses = activeTab === 'courses' ? pendingCourses : allCourses;

  return (
    <AppLayout title="Admin Approvals">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
              <ShieldCheck size={13} className="text-primary" />
              <span>Platform Governance & Quality Moderation</span>
            </div>
            <h2
              className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="admin-title"
            >
              Content Approvals
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body mt-1 max-w-xl">
              Inspect instructor-submitted courses, curriculum structure, and media before making them publicly discoverable.
            </p>
          </div>
        </motion.div>

        {/* Metrics Strip */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {statTiles.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="eh-panel p-5 rounded-2xl border border-border/80 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <p className="text-xs text-muted-foreground font-body font-semibold">{tile.label}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight tabular-nums text-foreground mt-1">
                    {tile.value}
                  </p>
                </div>
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${tile.bg}`}>
                  <Icon size={20} strokeWidth={2} className={tile.color} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tab Filter Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 bg-card border border-border rounded-xl p-1 gap-1 flex-wrap shadow-2xs">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  data-testid={`admin-tab-${tab.id}`}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold font-body transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground flex items-center gap-2"
                >
                  <Icon size={14} strokeWidth={2} />
                  <span>{tab.label}</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-muted/60 data-[state=active]:bg-white/20">
                    {tab.count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Courses Moderation Queue */}
        {loading ? (
          <LoadingState label="Loading submission queue from moderation database..." />
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title={activeTab === 'courses' ? 'Moderation queue is clean!' : 'No courses found in platform index'}
            description={activeTab === 'courses' ? 'All instructor submissions have been reviewed and approved.' : undefined}
          />
        ) : (
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="eh-panel rounded-2xl overflow-hidden border border-border/80 shadow-sm eh-divider-list"
          >
            {visibleCourses.map((course) => {
              const statusConf = getStatusConfig(course.status);
              const StatusIcon = statusConf.icon;
              const isProcessing = processing === course.course_id;

              return (
                <motion.div
                  key={course.course_id}
                  variants={itemVariants}
                  className="p-5 sm:p-6 hover:bg-muted/30 transition-colors duration-150"
                  data-testid={`admin-course-${course.course_id}`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <img
                      src={course.thumbnail}
                      alt=""
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0 ring-1 ring-border shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusConf.className}`}>
                          <StatusIcon size={12} strokeWidth={2} />
                          <span>{statusConf.label}</span>
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {course.category}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold font-heading text-foreground mb-1.5">
                        {course.title}
                      </h3>

                      <p className="text-xs sm:text-sm font-body text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-body">
                        <span className="flex items-center gap-1">
                          <User size={13} />
                          <span>Instructor: <strong className="text-foreground">{course.instructor_name}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          <span>Submitted: {new Date(course.created_at).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Moderation Actions (Approve / Reject Dialogs) */}
                    {course.status === 'PENDING' && (
                      <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center mt-3 sm:mt-0">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              disabled={isProcessing}
                              data-testid={`approve-course-${course.course_id}`}
                              className="eh-btn h-10 px-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                            >
                              {isProcessing ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={15} strokeWidth={2} />
                              )}
                              <span>Approve</span>
                            </motion.button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-border bg-card shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-heading text-lg flex items-center gap-2">
                                <CheckCircle className="text-emerald-500" size={20} strokeWidth={2} />
                                Approve Course for Publishing?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="font-body text-sm text-muted-foreground">
                                "{course.title}" will immediately be made available in the student catalog.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4">
                              <AlertDialogCancel className="eh-btn-outline rounded-xl font-body text-xs h-10 px-4">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCourseAction(course.course_id, 'APPROVED')}
                                className="eh-btn-primary rounded-xl font-body text-xs h-10 px-5 font-bold shadow-sm"
                              >
                                Confirm Approval
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              disabled={isProcessing}
                              data-testid={`reject-course-${course.course_id}`}
                              className="eh-btn h-10 px-4 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-xl font-bold text-xs flex items-center gap-1.5"
                            >
                              <XCircle size={15} strokeWidth={2} />
                              <span>Reject</span>
                            </motion.button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-border bg-card shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-heading text-lg flex items-center gap-2">
                                <XCircle className="text-destructive" size={20} strokeWidth={2} />
                                Reject Submitted Course?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="font-body text-sm text-muted-foreground">
                                "{course.title}" will be marked as rejected and returned to the instructor for revision.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4">
                              <AlertDialogCancel className="eh-btn-outline rounded-xl font-body text-xs h-10 px-4">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCourseAction(course.course_id, 'REJECTED')}
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body text-xs h-10 px-5 font-bold shadow-sm"
                              >
                                Confirm Rejection
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminApprovals;
