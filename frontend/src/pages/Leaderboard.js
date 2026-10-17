import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy,
  Medal,
  Crown,
  Gem,
  Sparkles,
  Flame,
  Award,
  ArrowUpRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const tierConfig = {
  BRONZE: {
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40',
    icon: Medal,
    label: 'Bronze',
    range: '0–499 XP'
  },
  SILVER: {
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-300/60 dark:border-slate-700/40',
    icon: Trophy,
    label: 'Silver',
    range: '500–1,999 XP'
  },
  GOLD: {
    text: 'text-yellow-700 dark:text-yellow-500',
    bg: 'bg-yellow-50/80 dark:bg-yellow-950/30 border-yellow-300/60 dark:border-yellow-900/40',
    icon: Crown,
    label: 'Gold',
    range: '2,000–4,999 XP'
  },
  PLATINUM: {
    text: 'text-teal-700 dark:text-teal-400',
    bg: 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-300/60 dark:border-teal-900/40',
    icon: Gem,
    label: 'Platinum',
    range: '5,000+ XP'
  }
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeOut } }
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overall');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/leaderboard/${activeTab}`, { withCredentials: true });
      setEntries(res.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const tabs = [
    { id: 'overall', label: 'All Time' },
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' }
  ];

  const getPointsField = () => {
    if (activeTab === 'weekly') return 'weekly_points';
    if (activeTab === 'monthly') return 'monthly_points';
    return 'points';
  };

  // Split top 3 for podium showcase if available
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <AppLayout title="Leaderboard">
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
              <Crown size={13} className="text-primary" />
              <span>Competitive Gamified League</span>
            </div>
            <h2
              className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="leaderboard-title"
            >
              Learner Leaderboard
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body mt-1 max-w-xl">
              Complete lessons (+10 XP), generate AI quizzes (+15 XP), and participate in live polls to ascend the tiers.
            </p>
          </div>

          {/* Timeframe Switcher Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="self-start md:self-auto">
            <TabsList className="h-11 bg-card border border-border rounded-xl p-1 gap-1 flex-wrap shadow-2xs">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  data-testid={`leaderboard-tab-${tab.id}`}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold font-body transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Tier Cards Showcase */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {Object.entries(tierConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <motion.div
                key={key}
                variants={itemVariants}
                className={`eh-panel p-4 rounded-xl text-center border ${config.bg} shadow-2xs`}
              >
                <div className="h-9 w-9 rounded-xl bg-background/80 mx-auto mb-2 flex items-center justify-center shadow-inner">
                  <Icon size={17} strokeWidth={2} className={config.text} />
                </div>
                <p className={`text-xs font-extrabold font-heading uppercase tracking-wider ${config.text}`}>
                  {config.label}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{config.range}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {loading ? (
          <LoadingState label="Computing global learner rankings..." />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No rankings in this period"
            description="Complete lessons or AI quizzes to earn points and claim rank #1 on the leaderboard."
          />
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium Showcase (if >= 3 entries) */}
            {topThree.length >= 2 && (
              <div className="eh-panel p-6 sm:p-8 rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 shadow-sm">
                <div className="text-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary font-heading flex items-center justify-center gap-1.5">
                    <Sparkles size={13} />
                    <span>Hall of Champions</span>
                  </h3>
                </div>

                <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4 max-w-lg mx-auto">
                  {/* Rank 2 (Silver) */}
                  {topThree[1] && (
                    <div className="flex-1 text-center flex flex-col items-center">
                      <div className="relative mb-2">
                        <img
                          src={topThree[1].picture}
                          alt={topThree[1].name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-slate-300 dark:ring-slate-600 shadow-md"
                        />
                        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-slate-400 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                          2
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-foreground font-heading truncate max-w-[100px] sm:max-w-[130px]">
                        {topThree[1].name}
                      </p>
                      <span className="text-xs font-extrabold text-slate-500 font-heading tabular-nums">
                        {topThree[1][getPointsField()]} XP
                      </span>
                      <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700/60 rounded-t-xl mt-3 flex items-center justify-center border-t-2 border-slate-300 dark:border-slate-600">
                        <Trophy size={20} className="text-slate-400" />
                      </div>
                    </div>
                  )}

                  {/* Rank 1 (Gold) */}
                  {topThree[0] && (
                    <div className="flex-1 text-center flex flex-col items-center -mt-6">
                      <div className="relative mb-2">
                        <Crown size={24} className="text-amber-500 absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce" />
                        <img
                          src={topThree[0].picture}
                          alt={topThree[0].name}
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-amber-400 dark:ring-amber-500 shadow-xl"
                        />
                        <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                          1
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-extrabold text-foreground font-heading truncate max-w-[110px] sm:max-w-[150px]">
                        {topThree[0].name}
                      </p>
                      <span className="text-sm font-extrabold text-primary font-heading tabular-nums">
                        {topThree[0][getPointsField()]} XP
                      </span>
                      <div className="w-full h-28 sm:h-32 bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 rounded-t-xl mt-3 flex items-center justify-center border-t-2 border-amber-400">
                        <Crown size={28} className="text-amber-500" />
                      </div>
                    </div>
                  )}

                  {/* Rank 3 (Bronze) */}
                  {topThree[2] && (
                    <div className="flex-1 text-center flex flex-col items-center">
                      <div className="relative mb-2">
                        <img
                          src={topThree[2].picture}
                          alt={topThree[2].name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-amber-700/40 shadow-md"
                        />
                        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                          3
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-foreground font-heading truncate max-w-[100px] sm:max-w-[130px]">
                        {topThree[2].name}
                      </p>
                      <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 font-heading tabular-nums">
                        {topThree[2][getPointsField()]} XP
                      </span>
                      <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-amber-100 to-amber-50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-t-xl mt-3 flex items-center justify-center border-t-2 border-amber-600/40">
                        <Medal size={18} className="text-amber-700" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Complete Rankings List */}
            <div className="eh-panel rounded-2xl overflow-hidden border border-border/80 shadow-sm">
              <div className="px-5 py-3.5 bg-muted/30 border-b border-border flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider font-heading">
                <span>Rank & Learner</span>
                <span>Experience Points</span>
              </div>

              <div className="eh-divider-list">
                {entries.map((entry, index) => {
                  const tier = tierConfig[entry.tier] || tierConfig.BRONZE;
                  const TierIcon = tier.icon;
                  const isCurrentUser = entry.user_id === user?.user_id;
                  const rank = entry.rank || index + 1;
                  const isTopThree = rank <= 3;

                  return (
                    <motion.div
                      key={entry.user_id}
                      variants={itemVariants}
                      className={`px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                        isCurrentUser
                          ? 'bg-primary/10 border-l-4 border-l-primary'
                          : 'hover:bg-muted/40'
                      }`}
                      data-testid={`leaderboard-row-${index}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Rank Badge */}
                        <span
                          className={`relative flex items-center justify-center rounded-xl font-extrabold text-xs sm:text-sm font-heading tabular-nums shrink-0 ${
                            rank === 1
                              ? 'w-9 h-9 bg-amber-500 text-white shadow-xs'
                              : rank === 2
                              ? 'w-9 h-9 bg-slate-400 text-white shadow-xs'
                              : rank === 3
                              ? 'w-9 h-9 bg-amber-700 text-white shadow-xs'
                              : 'w-8 h-8 bg-muted text-muted-foreground'
                          }`}
                        >
                          {rank}
                        </span>

                        {/* Avatar */}
                        <img
                          src={entry.picture}
                          alt={entry.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-border shrink-0"
                        />

                        {/* Name & Tier */}
                        <div className="min-w-0">
                          <p className="text-sm font-bold font-heading text-foreground truncate flex items-center gap-1.5">
                            <span>{entry.name}</span>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-primary-foreground">
                                You
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <TierIcon size={12} strokeWidth={2} className={tier.text} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${tier.text}`}>
                              {tier.label} Tier
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Points Display */}
                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-lg font-extrabold font-heading tabular-nums text-foreground">
                          {entry[getPointsField()]}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body font-bold uppercase tracking-wider">
                          XP Points
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
