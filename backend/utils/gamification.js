import User from '../models/User.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import UserProgress from '../models/UserProgress.js';

// Centralized point values for automatic, server-decided awards. Keeping
// these in one place means no route ever needs to trust a client-supplied
// point amount - see routes/users.js for the one exception (a capped,
// TEACHER/ADMIN-only manual award tool).
export const POINTS = {
  POLL_VOTE: 5,
  CONTENT_COMPLETE: 10,
  NOTE_CREATED: 5,
  QUIZ_MAX: 20
};

/**
 * Awards `points` to `user_id`, keeping User.points/tier and the
 * LeaderboardEntry projection in sync. This is the single place that should
 * ever mutate points so the leaderboard can't drift from the user record.
 */
export const awardPoints = async (user_id, points, reason) => {
  if (!points || points <= 0) return null;

  const user = await User.findOne({ user_id });
  if (!user) return null;

  // Points / leaderboard are student-only — teachers and admins never earn.
  if (user.role !== 'STUDENT') return null;

  user.points += points;
  user.updateTier();
  await user.save();

  await LeaderboardEntry.findOneAndUpdate(
    { user_id },
    {
      $inc: { points, weekly_points: points, monthly_points: points },
      $set: { name: user.name, picture: user.picture, tier: user.tier, last_updated: new Date() }
    },
    { upsert: true }
  );

  return { points: user.points, tier: user.tier, added: points, reason };
};

// Simple day-granularity streak: same calendar day keeps the streak,
// exactly one day later extends it, any bigger gap resets it to 1.
export const touchStreak = (progress) => {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const today = Math.floor(now.getTime() / dayMs);

  if (!progress.last_activity) {
    progress.streak_days = 1;
  } else {
    const lastDay = Math.floor(new Date(progress.last_activity).getTime() / dayMs);
    const diff = today - lastDay;
    if (diff === 1) {
      progress.streak_days = (progress.streak_days || 0) + 1;
    } else if (diff > 1) {
      progress.streak_days = 1;
    }
    // diff === 0 (already active today) -> leave streak_days unchanged
  }

  progress.last_activity = now;
};

export const BADGE_CATALOG = [
  { id: 'first_steps', label: 'First Steps', check: (p) => p.content_completed.length >= 1 },
  { id: 'bookworm', label: 'Bookworm', check: (p) => p.content_completed.length >= 10 },
  { id: 'quiz_ace', label: 'Quiz Ace', check: (p) => p.quiz_attempts.some((q) => q.total_questions > 0 && q.score / q.total_questions >= 1) },
  { id: 'quiz_master', label: 'Quiz Master', check: (p) => p.quiz_attempts.length >= 5 },
  { id: 'note_taker', label: 'Note Taker', check: (p) => p.notes_created >= 5 },
  { id: 'streak_starter', label: 'Streak Starter', check: (p) => p.streak_days >= 3 },
  { id: 'streak_master', label: 'Streak Master', check: (p) => p.streak_days >= 7 }
];

// Re-evaluates the full badge catalog against the current progress doc and
// appends any newly-earned badges. Mutates `progress.badges` in place;
// caller is responsible for saving. Never trusts a client-supplied badge id.
export const evaluateBadges = (progress) => {
  const newlyAwarded = [];
  for (const badge of BADGE_CATALOG) {
    if (!progress.badges.includes(badge.id) && badge.check(progress)) {
      progress.badges.push(badge.id);
      newlyAwarded.push(badge);
    }
  }
  return newlyAwarded;
};

// Atomically fetches-or-creates a progress doc, avoiding the unique-index
// race that a plain findOne -> new -> save pattern has under concurrent
// requests for the same brand-new user. Shared by routes/progress.js and
// the demo data seed script so both go through one code path.
export const getOrCreateProgress = async (user_id) => {
  return UserProgress.findOneAndUpdate(
    { user_id },
    { $setOnInsert: { user_id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Shared side-effect for "a piece of content was completed", used by
 * routes/progress.js (POST /track/content) and the demo data seed script.
 * Keeping this in one place means both entry points score/streak/badge a
 * completion identically instead of the seed script re-deriving its own
 * copy of the scoring rules.
 */
export const trackContentCompletion = async (user_id, content_id, time_spent = 0) => {
  const progress = await getOrCreateProgress(user_id);

  const existing = progress.content_completed.find((c) => c.content_id === content_id);
  const isFirstCompletion = !existing;
  if (!existing) {
    progress.content_completed.push({
      content_id,
      completed_at: new Date(),
      time_spent: time_spent || 0
    });
  } else {
    existing.completed_at = new Date();
    existing.time_spent = (existing.time_spent || 0) + (time_spent || 0);
  }

  progress.total_study_time = (progress.total_study_time || 0) + (time_spent || 0);
  touchStreak(progress);
  const newlyAwardedBadges = evaluateBadges(progress);
  progress.updated_at = new Date();
  await progress.save();

  if (isFirstCompletion) {
    await awardPoints(user_id, POINTS.CONTENT_COMPLETE, 'Completed course content');
  }

  return { progress, newlyAwardedBadges };
};

/**
 * Shared side-effect for "a quiz was attempted", used by routes/progress.js
 * (POST /track/quiz) and the demo data seed script.
 */
export const trackQuizAttempt = async (user_id, quiz_id, score, total_questions) => {
  const progress = await getOrCreateProgress(user_id);

  progress.quiz_attempts.push({
    quiz_id,
    score,
    total_questions,
    attempted_at: new Date()
  });

  touchStreak(progress);
  const newlyAwardedBadges = evaluateBadges(progress);
  progress.updated_at = new Date();
  await progress.save();

  const pointsEarned = Math.round((score / total_questions) * POINTS.QUIZ_MAX);
  if (pointsEarned > 0) {
    await awardPoints(user_id, pointsEarned, `Quiz score ${score}/${total_questions}`);
  }

  return { progress, newlyAwardedBadges, pointsEarned };
};

/**
 * Shared side-effect for "a note was created", used by routes/notes.js.
 * Mirrors what POST /api/progress/track/note does so the two entry points
 * (creating a note directly vs. the standalone tracking endpoint) can never
 * drift out of sync, and awards the standard note-creation point bonus.
 */
export const trackNoteCreated = async (user_id) => {
  const user = await User.findOne({ user_id });
  // Progress tracking is student-only.
  if (!user || user.role !== 'STUDENT') return null;

  const progress = await UserProgress.findOneAndUpdate(
    { user_id },
    { $setOnInsert: { user_id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  progress.notes_created = (progress.notes_created || 0) + 1;
  touchStreak(progress);
  evaluateBadges(progress);
  progress.updated_at = new Date();
  await progress.save();

  await awardPoints(user_id, POINTS.NOTE_CREATED, 'Created a study note');
  return progress;
};
