import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import { EmptyState } from '../components/PageState';
import { Skeleton } from '../components/ui/skeleton';
import axios from 'axios';
import {
  BookOpen,
  Trophy,
  Video,
  Brain,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Flame,
  Star,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  ChevronRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const TIER_TEXT = {
  BRONZE: 'text-amber-700 dark:text-amber-400',
  SILVER: 'text-slate-500 dark:text-slate-400',
  GOLD: 'text-yellow-700 dark:text-yellow-500',
  PLATINUM: 'text-teal-700 dark:text-teal-400'
};
const getTierText = (tier) => TIER_TEXT[tier] || TIER_TEXT.SILVER;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } }
};

const MotionLink = motion(Link);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const requests = [axios.get(`${API_URL}/api/courses`, { withCredentials: true })];
      if (user?.role === 'STUDENT' || user?.role === 'ADMIN') {
        requests.push(axios.get(`${API_URL}/api/leaderboard/overall`, { withCredentials: true }));
      }
      const results = await Promise.all(requests);
      setCourses(results[0].data.slice(0, 4));
      if (results[1]) {
        setLeaderboard(results[1].data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const isStudent = user?.role === 'STUDENT';
  const canViewLeaderboard = isStudent || user?.role === 'ADMIN';
  const canViewPolls = isStudent || user?.role === 'ADMIN';

  const quickActions = [
    { icon: BookOpen, label: 'Browse Courses', path: '/courses' },
    ...(canViewLeaderboard ? [{ icon: Trophy, label: 'Leaderboard', path: '/leaderboard' }] : []),
    { icon: Video, label: 'Live Class', path: '/video-classroom', highlight: true },
    { icon: Brain, label: 'AI Tutor', path: '/ai-assistant' },
    ...(canViewPolls ? [{ icon: BarChart3, label: 'Polls', path: '/polls' }] : [])
  ];

  if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
    quickActions.push({ icon: Users, label: 'My Courses', path: '/teacher/courses' });
  }
  if (user?.role === 'ADMIN') {
    quickActions.push({ icon: CheckCircle, label: 'Approvals', path: '/admin/approvals' });
  }

  const statCards = [
    ...(user?.role === 'STUDENT'
      ? [
          { label: 'Total XP Score', value: user?.points || 0, icon: Star, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Current Tier', value: user?.tier || 'BRONZE', icon: Trophy, color: 'text-primary bg-primary/10' }
        ]
      : []),
    { label: 'Active Courses', value: courses.length, icon: BookOpen, color: 'text-secondary bg-secondary/10' },
    { label: 'Platform Role', value: user?.role?.toLowerCase(), icon: Flame, capitalize: true, color: 'text-teal-600 bg-teal-500/10' }
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Greeting Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-6 sm:p-7 shadow-lift-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5"
        >
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="eh-badge-honey text-[10px]">
                <Zap size={11} className="fill-primary" /> Active Workspace
              </span>
              {isStudent && user?.tier && (
                <span className={`text-[11px] font-bold uppercase tracking-wider ${getTierText(user.tier)}`}>
                  • {user.tier} Learner
                </span>
              )}
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="dashboard-welcome"
            >
              Welcome back, {user?.name?.split(' ')[0]}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-body mt-1">
              Pick up where you left off or join your cohort in live classrooms.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2.5 shrink-0">
            <Link
              to="/courses"
              className="eh-btn-primary h-10 px-4 text-xs font-bold rounded-xl shadow-lift-sm"
            >
              <BookOpen size={14} />
              Continue Learning
            </Link>
            <Link
              to="/video-classroom"
              className="eh-btn-outline h-10 px-3.5 text-xs font-semibold rounded-xl"
            >
              <Video size={14} className="text-emerald-500" />
              Join Live Room
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-3.5"
          data-testid="user-stats-card"
        >
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="eh-card-glow rounded-2xl p-5 shadow-lift-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon size={17} strokeWidth={2} />
                  </span>
                </div>
                <p
                  className={`text-2xl font-extrabold font-heading tracking-tight tabular-nums text-foreground ${
                    stat.capitalize ? 'capitalize' : ''
                  }`}
                >
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground font-body mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Action Navigation Pills */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-heading mb-2.5">
            Quick Actions
          </p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-2"
          >
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <MotionLink
                  key={index}
                  to={action.path}
                  data-testid={`quick-action-${index}`}
                  variants={itemVariants}
                  whileTap={{ scale: 0.97 }}
                  className={`eh-card-glow h-10 px-4 rounded-xl text-xs font-bold font-body inline-flex items-center gap-2 ${
                    action.highlight ? 'border-primary/40 text-primary' : 'text-foreground'
                  }`}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.8}
                    className="text-primary transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                  <span>{action.label}</span>
                </MotionLink>
              );
            })}
          </motion.div>
        </div>

        {/* Main Split: Courses & Leaderboard */}
        <div className={`grid grid-cols-1 ${canViewLeaderboard ? 'lg:grid-cols-5' : ''} gap-6`}>
          
          {/* Available Courses */}
          <div className={canViewLeaderboard ? 'lg:col-span-3' : ''}>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="eh-section-title">Available Courses</h3>
                <p className="text-xs text-muted-foreground">Curated study modules for your cohort</p>
              </div>
              <Link
                to="/courses"
                className="flex items-center gap-1 text-xs font-bold font-heading text-primary hover:underline group"
              >
                <span>View all catalog</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[0, 1].map((i) => (
                  <div key={i} className="eh-panel rounded-2xl overflow-hidden p-0">
                    <Skeleton className="w-full h-32 rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses available yet"
                description="Check back soon for new content published by your teachers."
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
              >
                {courses.map((course) => (
                  <motion.button
                    type="button"
                    key={course.course_id}
                    variants={itemVariants}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/courses/${course.course_id}`)}
                    className="eh-card-glow rounded-2xl overflow-hidden text-left shadow-lift-sm group"
                    data-testid={`course-card-${course.course_id}`}
                  >
                    <div className="overflow-hidden relative h-32 bg-slate-900">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                        {course.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-bold font-heading text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 font-body leading-relaxed">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        <span className="truncate font-medium">{course.instructor_name}</span>
                        <span className="text-primary font-semibold flex items-center gap-0.5">
                          Open <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Top Learners Podium Widget */}
          {canViewLeaderboard && (
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="eh-section-title">Top Learners</h3>
                  <p className="text-xs text-muted-foreground">Weekly cohort rankings</p>
                </div>
                <Link
                  to="/leaderboard"
                  className="flex items-center gap-1 text-xs font-bold font-heading text-primary hover:underline group"
                >
                  <span>Full podium</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="eh-card-glow rounded-2xl overflow-hidden shadow-lift-sm">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-7 h-7 rounded-full" />
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-2 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <EmptyState icon={Trophy} title="No rankings yet" className="border-0 shadow-none py-8" />
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-border/60">
                    {leaderboard.map((entry, index) => {
                      const isFirst = index === 0;
                      const isSecond = index === 1;
                      const isThird = index === 2;
                      return (
                        <motion.div
                          key={entry.user_id}
                          variants={itemVariants}
                          className="px-4 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                          data-testid={`leaderboard-entry-${index}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-heading tabular-nums shrink-0 ${
                              isFirst
                                ? 'bg-amber-500 text-white shadow-lift-sm'
                                : isSecond
                                ? 'bg-slate-400 text-white'
                                : isThird
                                ? 'bg-amber-700 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {entry.rank || index + 1}
                          </span>
                          <img
                            src={entry.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-border shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold font-heading text-foreground truncate">{entry.name}</p>
                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${getTierText(entry.tier)}`}>
                              {entry.tier}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-extrabold font-heading tabular-nums text-foreground">
                              {entry.points}
                            </p>
                            <span className="text-[10px] text-muted-foreground">pts</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
