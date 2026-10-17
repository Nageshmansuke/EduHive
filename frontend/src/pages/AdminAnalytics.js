import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import {
  Users,
  BookOpen,
  BarChart3,
  PenTool,
  FileText,
  MessageSquare,
  AlertTriangle,
  GraduationCap,
  Shield,
  Activity,
  Sparkles,
  TrendingUp,
  Layers
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeOut } }
};

const ROLE_BADGE = {
  ADMIN: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  TEACHER: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
  STUDENT: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/analytics`, { withCredentials: true });
      setData(res.data);
    } catch (error) {
      console.error('Fetch analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Analytics">
        <LoadingState label="Computing platform engagement telemetry & metrics..." />
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout title="Analytics">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load analytics"
          description="Unable to connect to the platform telemetry service. Please refresh the page."
        />
      </AppLayout>
    );
  }

  const statCards = [
    { label: 'Total Users', value: data.users.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Students', value: data.users.students, icon: GraduationCap, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Teachers', value: data.users.teachers, icon: Users, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    { label: 'Admins', value: data.users.admins, icon: Shield, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Total Courses', value: data.courses.total, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Approved', value: data.courses.approved, icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Pending', value: data.courses.pending, icon: BookOpen, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Active Polls', value: data.polls.active, icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Whiteboards', value: data.whiteboards.active, icon: PenTool, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    { label: 'Study Notes', value: data.notes.total, icon: FileText, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Chat Messages', value: data.messages.total, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Total Polls', value: data.polls.total, icon: BarChart3, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' }
  ];

  return (
    <AppLayout title="Analytics">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
              <Activity size={13} className="text-primary animate-pulse" />
              <span>Real-Time Platform Intelligence</span>
            </div>
            <h2
              className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="analytics-title"
            >
              Platform Telemetry & Analytics
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body mt-1 max-w-xl">
              High-level overview of active learners, curriculum growth, collaboration sessions, and real-time community engagement.
            </p>
          </div>
        </motion.div>

        {/* 12 Stat Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Platform Vital Metrics
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry Feed
            </span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
          >
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  className="eh-panel p-5 rounded-2xl border border-border/80 shadow-2xs hover:shadow-sm transition-all"
                  data-testid={`stat-card-${i}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground font-body">
                      {card.label}
                    </span>
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${card.bg}`}>
                      <Icon size={16} strokeWidth={2} className={card.color} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight tabular-nums text-foreground">
                    {card.value}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Recent Registrations / Users Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Recent Platform Registrations
            </h3>
            <span className="text-xs text-muted-foreground">
              {data.recent_users?.length || 0} recent learners
            </span>
          </div>

          <div className="eh-panel rounded-2xl overflow-hidden border border-border/80 shadow-sm">
            {(!data.recent_users || data.recent_users.length === 0) ? (
              <EmptyState icon={Users} title="No recent users" className="border-0 shadow-none py-10" />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="eh-divider-list"
              >
                {data.recent_users?.map((u, i) => (
                  <motion.div
                    key={u.user_id}
                    variants={itemVariants}
                    className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-muted/30 transition-colors duration-150"
                    data-testid={`recent-user-${i}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={u.picture}
                        alt=""
                        className="w-10 h-10 rounded-full ring-2 ring-border object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold font-heading text-foreground truncate">
                          {u.name}
                        </p>
                        <p className="text-xs font-body text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-body border ${
                          ROLE_BADGE[u.role] || ROLE_BADGE.STUDENT
                        }`}
                      >
                        {u.role}
                      </span>
                      <span className="text-sm font-extrabold font-heading tabular-nums text-primary">
                        {u.points} XP
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminAnalytics;
