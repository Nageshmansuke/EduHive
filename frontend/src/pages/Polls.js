import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { cn } from '../lib/utils';
import {
  BarChart3,
  Plus,
  CheckCircle2,
  X,
  Lock,
  Vote,
  Sparkles,
  Users,
  Activity,
  Check,
  TrendingUp
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeOut } }
};

const Polls = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [creating, setCreating] = useState(false);
  const [justVoted, setJustVoted] = useState(null);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/polls`, { withCredentials: true });
      setPolls(res.data);
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  useEffect(() => {
    if (!socket) return;
    polls.forEach(poll => {
      socket.emit('join_poll_room', { poll_id: poll.poll_id });
    });

    socket.on('poll_updated', (updatedPoll) => {
      setPolls(prev => prev.map(p => p.poll_id === updatedPoll.poll_id ? updatedPoll : p));
    });

    socket.on('poll_closed', (closedPoll) => {
      setPolls(prev => prev.map(p => p.poll_id === closedPoll.poll_id ? closedPoll : p));
    });

    return () => {
      socket.off('poll_updated');
      socket.off('poll_closed');
      polls.forEach(poll => {
        socket.emit('leave_poll_room', { poll_id: poll.poll_id });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, polls.length]);

  useEffect(() => {
    if (!justVoted) return;
    const timer = setTimeout(() => setJustVoted(null), 800);
    return () => clearTimeout(timer);
  }, [justVoted]);

  const handleCreatePoll = async () => {
    if (!newPoll.question || newPoll.options.filter(o => o.trim()).length < 2) return;
    setCreating(true);
    try {
      const res = await axios.post(`${API_URL}/api/polls`, {
        question: newPoll.question,
        options: newPoll.options.filter(o => o.trim())
      }, { withCredentials: true });
      setPolls([res.data, ...polls]);
      setNewPoll({ question: '', options: ['', ''] });
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create poll:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    setJustVoted({ pollId, optionId });
    try {
      const res = await axios.post(`${API_URL}/api/polls/${pollId}/vote`, { option_id: optionId }, { withCredentials: true });
      setPolls(prev => prev.map(p => p.poll_id === pollId ? res.data : p));
    } catch (error) {
      console.error('Vote failed:', error);
      alert(error.response?.data?.error || 'Failed to vote');
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      const res = await axios.patch(`${API_URL}/api/polls/${pollId}/close`, {}, { withCredentials: true });
      setPolls(prev => prev.map(p => p.poll_id === pollId ? res.data : p));
    } catch (error) {
      console.error('Failed to close poll:', error);
    }
  };

  const getTotalVotes = (options) => options.reduce((sum, o) => sum + o.votes, 0);
  const getPercentage = (votes, total) => total === 0 ? 0 : Math.round((votes / total) * 100);

  const canCreatePoll = user?.role === 'STUDENT' || user?.role === 'ADMIN';

  const totalPollsCount = polls.length;
  const activePollsCount = polls.filter(p => p.is_active).length;
  const totalVotesCast = polls.reduce((sum, p) => sum + getTotalVotes(p.options || []), 0);

  return (
    <AppLayout title="Polls">
      <div className="max-w-4xl mx-auto space-y-8">
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
              <span>Real-Time Telemetry & Peer Consensus</span>
            </div>
            <h2
              className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="polls-title"
            >
              Interactive Live Polls
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body mt-1 max-w-xl">
              Vote on conceptual quizzes, classroom checkpoints, and study schedules. Instant live results synced via WebSocket.
            </p>
          </div>
          {canCreatePoll && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(!showCreate)}
              data-testid="create-poll-button"
              className="eh-btn-primary h-11 px-5 shadow-sm self-start md:self-auto"
            >
              <Plus size={16} strokeWidth={2} />
              <span>New Poll</span>
            </motion.button>
          )}
        </motion.div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="eh-panel p-4 rounded-xl border border-border/80 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Vote size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">Total Polls</p>
              <p className="text-xl font-extrabold font-heading text-foreground tabular-nums">{totalPollsCount}</p>
            </div>
          </div>
          <div className="eh-panel p-4 rounded-xl border border-border/80 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">Active Now</p>
              <p className="text-xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400 tabular-nums">{activePollsCount}</p>
            </div>
          </div>
          <div className="eh-panel p-4 rounded-xl border border-border/80 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <TrendingUp size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">Votes Cast</p>
              <p className="text-xl font-extrabold font-heading text-foreground tabular-nums">{totalVotesCast}</p>
            </div>
          </div>
        </div>

        {/* Create Poll Drawer */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: easeOut }}
              className="eh-panel p-6 rounded-2xl border-2 border-primary/30 shadow-lg bg-card"
              data-testid="create-poll-form"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                  <Vote size={16} className="text-primary" />
                  Launch New Audience Poll
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                placeholder="What question would you like to poll? (e.g. Best time for next revision session?)"
                value={newPoll.question}
                onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                data-testid="poll-question-input"
                className="eh-input mb-4 h-11 text-sm font-semibold"
                autoFocus
              />

              <div className="space-y-2.5 mb-4">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Voting Options (Minimum 2)
                </label>
                {newPoll.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-9 w-9 rounded-xl bg-muted/60 text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 border border-border">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...newPoll.options];
                        opts[i] = e.target.value;
                        setNewPoll({ ...newPoll, options: opts });
                      }}
                      data-testid={`poll-option-input-${i}`}
                      className="eh-input flex-1 h-10 text-xs"
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        onClick={() => setNewPoll({ ...newPoll, options: newPoll.options.filter((_, j) => j !== i) })}
                        data-testid={`remove-poll-option-${i}`}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                  onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                  data-testid="add-poll-option-button"
                  className="text-xs font-bold text-primary hover:underline font-body flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Another Choice</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    data-testid="cancel-poll-button"
                    className="eh-btn-ghost h-10 px-4 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreatePoll}
                    disabled={creating || !newPoll.question.trim()}
                    data-testid="submit-poll-button"
                    className="eh-btn-primary h-10 px-5 text-xs font-bold shadow-sm disabled:opacity-50"
                  >
                    {creating ? 'Publishing...' : 'Launch Poll'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Polls Listing */}
        {loading ? (
          <LoadingState label="Connecting to live voting rooms..." />
        ) : polls.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No polls active"
            description={canCreatePoll ? 'Create the first poll to engage your learning group.' : 'Check back soon for live interactive polls.'}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {polls.map((poll) => {
              const totalVotes = getTotalVotes(poll.options);
              const hasVoted = poll.voters?.some(v => v.user_id === user?.user_id);
              const isCreator = poll.created_by === user?.user_id;

              return (
                <motion.div
                  key={poll.poll_id}
                  variants={cardVariants}
                  className="eh-panel rounded-2xl overflow-hidden border border-border/80 hover:border-primary/40 transition-all duration-200 shadow-sm"
                  data-testid={`poll-card-${poll.poll_id}`}
                >
                  <div className="p-6">
                    {/* Header: Question & Status */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                          <Vote size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-foreground font-heading leading-snug">
                            {poll.question}
                          </h3>
                          <p className="text-xs text-muted-foreground font-body mt-1">
                            {totalVotes} total responses · {poll.is_active ? 'Live real-time polling' : 'Closed'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {poll.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                            <Lock size={12} />
                            <span>Closed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {poll.options.map((option, optIdx) => {
                          const pct = getPercentage(option.votes, totalVotes);
                          const canVote = poll.is_active && !hasVoted;
                          const isJustVoted = justVoted?.pollId === poll.poll_id && justVoted?.optionId === option.option_id;

                          return (
                            <motion.button
                              key={option.option_id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0, scale: isJustVoted ? [1, 1.02, 1] : 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: easeOut }}
                              whileTap={canVote ? { scale: 0.98 } : {}}
                              onClick={() => canVote && handleVote(poll.poll_id, option.option_id)}
                              disabled={!canVote}
                              data-testid={`poll-option-${option.option_id}`}
                              className={cn(
                                'relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-150',
                                canVote
                                  ? 'border-border/90 hover:border-primary/60 cursor-pointer bg-card hover:bg-muted/30 shadow-2xs'
                                  : 'border-border/60 bg-muted/20 cursor-default'
                              )}
                            >
                              {/* Background Animated Progress Bar */}
                              <motion.div
                                className="absolute inset-y-0 left-0 bg-primary/15"
                                initial={false}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.45, ease: easeOut }}
                              />

                              {/* Flash effect on vote */}
                              <AnimatePresence>
                                {isJustVoted && (
                                  <motion.div
                                    className="absolute inset-0 bg-primary/25"
                                    initial={{ opacity: 0.6 }}
                                    animate={{ opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: easeOut }}
                                  />
                                )}
                              </AnimatePresence>

                              {/* Content Info */}
                              <div className="relative z-10 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="h-6 w-6 rounded-md bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 border border-border">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="font-bold text-sm text-foreground font-body">
                                    {option.text}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-sm font-extrabold text-primary font-heading tabular-nums">
                                    {pct}%
                                  </span>
                                  <p className="text-[11px] text-muted-foreground font-body tabular-nums">
                                    {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                                  </p>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Card Footer: Metadata and Creator Action */}
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/80">
                      <div className="flex items-center gap-2">
                        {hasVoted ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-body bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 size={13} />
                            <span>Your vote was recorded</span>
                          </span>
                        ) : poll.is_active ? (
                          <span className="text-xs text-muted-foreground font-body">
                            Click any option to cast your vote
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-body">
                            This poll has concluded
                          </span>
                        )}
                      </div>

                      {poll.is_active && isCreator && canCreatePoll && (
                        <button
                          onClick={() => handleClosePoll(poll.poll_id)}
                          data-testid={`close-poll-${poll.poll_id}`}
                          className="text-xs font-bold text-destructive hover:underline font-body px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          Conclude & Close Poll
                        </button>
                      )}
                    </div>
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

export default Polls;
