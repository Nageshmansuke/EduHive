import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Flame, BookOpen, Award, Clock, LineChart as LineChartIcon, CheckCircle2, Lock, Zap } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const ALL_MILESTONES = [
  { id: 'first_steps', name: 'First Steps', desc: 'Complete your first lesson module', points: 10 },
  { id: 'bookworm', name: 'Bookworm', desc: 'Complete 5 courses or study guides', points: 50 },
  { id: 'quiz_ace', name: 'Quiz Ace', desc: 'Score 100% on any AI-generated quiz', points: 20 },
  { id: 'quiz_master', name: 'Quiz Master', desc: 'Complete 10 knowledge check quizzes', points: 100 },
  { id: 'note_taker', name: 'Note Taker', desc: 'Publish a collaborative study note', points: 15 },
  { id: 'streak_starter', name: 'Streak Starter', desc: 'Study 3 days in a row', points: 30 },
  { id: 'streak_master', name: 'Streak Master', desc: 'Maintain a 7-day study streak', points: 75 }
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } }
};

const ProgressTracking = () => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/progress/user/${user.user_id}`,
        { withCredentials: true }
      );
      setProgress(res.data);
    } catch (error) {
      console.error('Fetch progress error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading) {
    return (
      <AppLayout title="Progress Tracking">
        <LoadingState label="Loading your learning analytics..." />
      </AppLayout>
    );
  }

  if (!progress) {
    return (
      <AppLayout title="Progress Tracking">
        <EmptyState
          icon={LineChartIcon}
          title="No progress recorded yet"
          description="Start completing lessons, quizzes, or live class polls to track your progress."
        />
      </AppLayout>
    );
  }

  const totalStudySeconds = progress.total_study_time || 0;
  const totalStudyHours = totalStudySeconds / 3600;

  const stats = [
    {
      label: 'Total Study Time',
      value: totalStudyHours >= 1
        ? `${totalStudyHours.toFixed(1)} hrs`
        : `${Math.round(totalStudySeconds / 60)} min`,
      icon: Clock,
      color: 'text-primary bg-primary/10'
    },
    {
      label: 'Lessons Completed',
      value: progress.content_completed?.length || 0,
      icon: BookOpen,
      color: 'text-secondary bg-secondary/10'
    },
    {
      label: 'Quizzes Taken',
      value: progress.quiz_attempts?.length || 0,
      icon: TrendingUp,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      label: 'Active Study Streak',
      value: `${progress.streak_days || 0} days`,
      icon: Flame,
      color: 'text-rose-500 bg-rose-500/10'
    }
  ];

  const quizScores = (progress.quiz_attempts || []).map((quiz, idx) => ({
    name: `Quiz ${idx + 1}`,
    score: Math.round((quiz.score / quiz.total_questions) * 100)
  }));

  const studyTimeData = (() => {
    const days = [];
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ date: d, name: dayFormatter.format(d), seconds: 0 });
    }

    (progress.content_completed || []).forEach((item) => {
      if (!item.completed_at) return;
      const completedDate = new Date(item.completed_at);
      completedDate.setHours(0, 0, 0, 0);
      const bucket = days.find((d) => d.date.getTime() === completedDate.getTime());
      if (bucket) bucket.seconds += item.time_spent || 0;
    });

    return days.map((d) => ({ name: d.name, hours: +(d.seconds / 3600).toFixed(2) }));
  })();
  const hasStudyTimeData = studyTimeData.some((d) => d.hours > 0);

  const earnedBadges = new Set(progress.badges || []);

  const chartGrid = isDark ? '#27272a' : '#e4e4e7';
  const chartTick = isDark ? '#a1a1aa' : '#71717a';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';
  const honey = '#f59e0b';
  const teal = '#14b8a6';

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: 12,
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: 12,
    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.15)'
  };
  const tickStyle = { fill: chartTick, fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif' };

  return (
    <AppLayout title="Progress Tracking">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="eh-badge-honey text-[10px]">Academic Analytics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground">
              Learning Mastery & Achievements
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-body mt-1">
              Visualize your daily learning rhythm, quiz accuracy, and milestone rewards.
            </p>
          </div>
          {progress.last_activity && (
            <div className="text-xs text-muted-foreground font-body bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60">
              Last study session: {new Date(progress.last_activity).toLocaleDateString()}
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="eh-card-glow rounded-2xl p-5 shadow-lift-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon size={17} strokeWidth={2} />
                  </span>
                </div>
                <p className="text-2xl font-extrabold font-heading tracking-tight tabular-nums text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground font-body mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quizScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className="eh-card-glow rounded-2xl p-5 sm:p-6 shadow-lift-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="eh-section-title">Quiz Performance</h3>
                  <p className="text-xs text-muted-foreground font-body">Accuracy percentage over recent quizzes</p>
                </div>
                <span className="eh-badge-honey text-[10px]">AI Tested</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={quizScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="name" tick={tickStyle} axisLine={{ stroke: chartGrid }} tickLine={{ stroke: chartGrid }} />
                  <YAxis domain={[0, 100]} tick={tickStyle} axisLine={{ stroke: chartGrid }} tickLine={{ stroke: chartGrid }} />
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: chartTick, fontWeight: 700 }}
                    cursor={{ fill: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)' }}
                  />
                  <Bar dataKey="score" fill={honey} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.04, ease: easeOut }}
            className="eh-card-glow rounded-2xl p-5 sm:p-6 shadow-lift-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="eh-section-title">Last 7 Days Study Time</h3>
                <p className="text-xs text-muted-foreground font-body">Hours spent inside lessons and workshops</p>
              </div>
              <span className="eh-badge-teal text-[10px]">Daily Rhythm</span>
            </div>
            {hasStudyTimeData ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={studyTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="name" tick={tickStyle} axisLine={{ stroke: chartGrid }} tickLine={{ stroke: chartGrid }} />
                  <YAxis tick={tickStyle} axisLine={{ stroke: chartGrid }} tickLine={{ stroke: chartGrid }} />
                  <Tooltip
                    formatter={(value) => `${value} hrs`}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: chartTick, fontWeight: 700 }}
                    cursor={{ stroke: teal, strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke={teal}
                    strokeWidth={2.5}
                    dot={{ fill: teal, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: teal, stroke: tooltipBg, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-xs text-muted-foreground text-center px-6">
                <Clock size={28} className="text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground">No study sessions logged this week</p>
                <p>Complete course modules or participate in live class to see your activity graph.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Milestones & Badges Center */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="eh-card-glow rounded-2xl p-6 shadow-lift-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="eh-section-title flex items-center gap-2">
                <Award size={18} className="text-primary" />
                Platform Milestones & Badges
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Earn verified badges that raise your leaderboard standing
              </p>
            </div>
            <span className="eh-badge-honey text-xs font-bold">
              {earnedBadges.size} / {ALL_MILESTONES.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {ALL_MILESTONES.map((badge) => {
              const isUnlocked = earnedBadges.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-xl p-4 border transition-all ${
                    isUnlocked
                      ? 'border-primary/40 bg-primary/5 shadow-lift-sm ring-1 ring-primary/20'
                      : 'border-border/60 bg-muted/30 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isUnlocked
                          ? 'bg-primary text-primary-foreground shadow-lift-sm'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isUnlocked ? <Award size={16} strokeWidth={2.4} /> : <Lock size={15} />}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      +{badge.points} XP
                    </span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-foreground mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-muted-foreground font-body leading-relaxed">
                    {badge.desc}
                  </p>
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className={isUnlocked ? 'text-primary font-bold flex items-center gap-1' : 'text-muted-foreground'}>
                      {isUnlocked ? (
                        <>
                          <CheckCircle2 size={12} /> Unlocked
                        </>
                      ) : (
                        'Locked'
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ProgressTracking;
