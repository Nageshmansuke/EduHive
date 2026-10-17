/**
 * Demo/seed data generator for local development and demos.
 *
 * This script is the ONLY place demo content should live - never hardcode
 * sample users/courses/etc. into route handlers or React components. It
 * intentionally reuses the same models and gamification utilities the real
 * app uses (User.pre-save password hashing, awardPoints, trackContentCompletion,
 * trackQuizAttempt, trackNoteCreated, deleteUserCascade) instead of
 * re-deriving scoring/cascade logic here, so the app's real business rules
 * are always the single source of truth.
 *
 * Usage:
 *   cd backend
 *   npm run seed
 *
 * Safe to re-run: every demo account is identified by a fixed @eduhive.dev
 * email, and this script fully removes any previous demo users (and
 * everything they own, via the same cascade delete used by the admin panel)
 * before recreating them, so running it twice never duplicates data or
 * touches real accounts created by actual users.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import mongoose, { connectDatabase } from '../config/database.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Content from '../models/Content.js';
import Poll from '../models/Poll.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import WhiteboardSession from '../models/WhiteboardSession.js';
import StudyNote from '../models/StudyNote.js';
import NoteCollaboration from '../models/NoteCollaboration.js';
import SessionChat from '../models/SessionChat.js';
import ChatMessage from '../models/ChatMessage.js';

import { uploadsDir } from '../middleware/upload.js';
import { deleteUserCascade } from '../utils/cascadeDelete.js';
import {
  awardPoints,
  trackContentCompletion,
  trackQuizAttempt,
  trackNoteCreated,
  POINTS
} from '../utils/gamification.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_EMAIL_DOMAIN = '@eduhive.dev';
const DEMO_PASSWORD = 'Demo@12345';
const avatar = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const DEMO_USERS = [
  { key: 'admin', email: `priya.admin${DEMO_EMAIL_DOMAIN}`, name: 'Priya Sharma', role: 'ADMIN' },
  { key: 'ava', email: `ava.chen${DEMO_EMAIL_DOMAIN}`, name: 'Ava Chen', role: 'TEACHER' },
  { key: 'marcus', email: `marcus.lee${DEMO_EMAIL_DOMAIN}`, name: 'Marcus Lee', role: 'TEACHER' },
  { key: 'liam', email: `liam.patel${DEMO_EMAIL_DOMAIN}`, name: 'Liam Patel', role: 'STUDENT' },
  { key: 'zoe', email: `zoe.martinez${DEMO_EMAIL_DOMAIN}`, name: 'Zoe Martinez', role: 'STUDENT' },
  { key: 'noah', email: `noah.kim${DEMO_EMAIL_DOMAIN}`, name: 'Noah Kim', role: 'STUDENT' },
  { key: 'maya', email: `maya.singh${DEMO_EMAIL_DOMAIN}`, name: 'Maya Singh', role: 'STUDENT' },
  { key: 'ethan', email: `ethan.brooks${DEMO_EMAIL_DOMAIN}`, name: 'Ethan Brooks', role: 'STUDENT' }
];

// ---------------------------------------------------------------------------
// Placeholder file helpers
// ---------------------------------------------------------------------------
// Demo PDF/Markdown attachments use real, valid files written straight into
// the same uploads/<folder> layout middleware/upload.js already creates, so
// the content viewer works exactly like it would for a real upload. A real
// playable video binary can't reasonably be generated inline here, so the
// one demo "video" lecture uses a clearly-labelled placeholder text file -
// everything else about it (title, duration, approval status) is realistic.

const MINIMAL_PDF = `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Resources<<>>/MediaBox[0 0 612 792]>>endobj
trailer<</Root 1 0 R>>
`;

let fileCounter = 0;
const writeDemoFile = (folder, baseName, contents) => {
  fileCounter += 1;
  const filename = `demo-${Date.now()}-${fileCounter}-${baseName}`;
  const dir = path.join(uploadsDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), contents);
  return { file_path: path.join(dir, filename), file_url: `/uploads/${folder}/${filename}` };
};

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ---------------------------------------------------------------------------
// Cleanup: remove any previous run's demo accounts (and everything they own)
// ---------------------------------------------------------------------------
const cleanupPreviousDemoData = async () => {
  const existing = await User.find({ email: { $in: DEMO_USERS.map((u) => u.email) } });
  for (const user of existing) {
    await deleteUserCascade(user.user_id);
    await User.deleteOne({ user_id: user.user_id });
  }
  // Polls/whiteboards/session chat/AI history aren't covered by
  // deleteUserCascade (see its own comments on why), so sweep anything left
  // over from a previous demo run explicitly.
  const demoUserIds = existing.map((u) => u.user_id);
  if (demoUserIds.length > 0) {
    await Poll.deleteMany({ created_by: { $in: demoUserIds } });
    await WhiteboardSession.deleteMany({ created_by: { $in: demoUserIds } });
    await SessionChat.deleteMany({ user_id: { $in: demoUserIds } });
    await ChatMessage.deleteMany({ user_id: { $in: demoUserIds } });
  }
  if (existing.length > 0) {
    console.log(`  Removed ${existing.length} previous demo user(s) and their owned data.`);
  }
};

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
const run = async () => {
  console.log('Connecting to database...');
  await connectDatabase();

  console.log('Cleaning up any previous demo data...');
  await cleanupPreviousDemoData();

  console.log('Creating demo users...');
  const users = {};
  for (const u of DEMO_USERS) {
    const doc = new User({
      email: u.email,
      password: DEMO_PASSWORD,
      name: u.name,
      role: u.role,
      picture: avatar(u.name),
      points: 0,
      tier: u.role === 'STUDENT' ? 'BRONZE' : null
    });
    await doc.save();
    users[u.key] = doc;
  }

  const students = [users.liam, users.zoe, users.noah, users.maya, users.ethan];

  console.log('Creating courses...');
  const courseDefs = [
    { teacher: users.ava, title: 'Introduction to Python Programming', category: 'Programming', status: 'APPROVED',
      description: 'A beginner-friendly tour of Python: variables, control flow, functions, and simple data structures, with hands-on exercises after every lesson.' },
    { teacher: users.ava, title: 'Data Structures & Algorithms', category: 'Programming', status: 'APPROVED',
      description: 'Core computer science fundamentals - arrays, linked lists, trees, graphs, sorting, and searching - explained with visual walkthroughs.' },
    { teacher: users.ava, title: 'Applied Machine Learning', category: 'Data Science', status: 'PENDING',
      description: 'A practical introduction to supervised learning, model evaluation, and building your first predictive models with real datasets.' },
    { teacher: users.marcus, title: 'Calculus I: Limits & Derivatives', category: 'Mathematics', status: 'APPROVED',
      description: 'Build strong calculus foundations, from limits and continuity through differentiation rules and their real-world applications.' },
    { teacher: users.marcus, title: 'Modern Web Development', category: 'Web Development', status: 'APPROVED',
      description: 'Learn to build responsive, accessible websites with HTML, CSS, and modern JavaScript, capped off with a portfolio project.' },
    { teacher: users.marcus, title: 'Intro to UI/UX Design', category: 'Design', status: 'PENDING',
      description: 'Design thinking, wireframing, and usability principles for building interfaces people actually enjoy using.' }
  ];

  const courses = [];
  for (const def of courseDefs) {
    const course = new Course({
      title: def.title,
      description: def.description,
      category: def.category,
      instructor_id: def.teacher.user_id,
      instructor_name: def.teacher.name,
      status: def.status,
      thumbnail: `https://picsum.photos/seed/${encodeURIComponent(def.title)}/640/360`,
      enrolled_students: Math.floor(Math.random() * 40) + 5
    });
    await course.save();
    courses.push(course);
  }

  // Named references (rather than indexing the filtered approved-courses
  // array) so later sections can't silently drift out of sync if courseDefs
  // above is reordered or a status is flipped.
  const [pythonCourse, dsaCourse, mlCourse, calculusCourse, webDevCourse, uiuxCourse] = courses;
  const approvedCourses = courses.filter((c) => c.status === 'APPROVED');

  console.log('Uploading demo course content...');
  const allContent = [];
  for (const course of courses) {
    const owner = course.instructor_id === users.ava.user_id ? users.ava : users.marcus;

    const markdown = writeDemoFile(
      'markdown',
      'lesson-notes.md',
      `# ${course.title} - Lesson 1 Notes\n\nWelcome to **${course.title}**! This lesson covers the foundational concepts you'll build on throughout the course.\n\n## Key takeaways\n- Understand the core terminology\n- Follow along with the guided examples\n- Complete the practice exercises before the next lesson\n`
    );
    const markdownContent = new Content({
      course_id: course.course_id,
      title: 'Lesson 1: Getting Started (Notes)',
      description: 'Written lesson notes to accompany the first session.',
      type: 'MARKDOWN',
      file_path: markdown.file_path,
      file_url: markdown.file_url,
      order: 0,
      uploaded_by: owner.user_id,
      status: course.status === 'APPROVED' ? 'APPROVED' : 'PENDING'
    });
    await markdownContent.save();
    allContent.push(markdownContent);

    const pdf = writeDemoFile('pdfs', 'syllabus.pdf', MINIMAL_PDF);
    const pdfContent = new Content({
      course_id: course.course_id,
      title: 'Course Syllabus',
      description: 'Full course outline, grading breakdown, and schedule.',
      type: 'PDF',
      file_path: pdf.file_path,
      file_url: pdf.file_url,
      order: 1,
      uploaded_by: owner.user_id,
      status: course.status === 'APPROVED' ? 'APPROVED' : 'PENDING'
    });
    await pdfContent.save();
    allContent.push(pdfContent);

    // Note: this is a placeholder text file, not a real playable video -
    // generating an actual media binary isn't practical from a seed script.
    // It still exercises the full content pipeline (upload, approval,
    // listing, progress tracking) end to end.
    const video = writeDemoFile(
      'videos',
      'lecture-1.mp4.txt',
      `Placeholder for "Lecture 1" video recording of ${course.title}.\nReplace this file with a real upload via the Teacher Courses page to test video playback.`
    );
    const videoContent = new Content({
      course_id: course.course_id,
      title: 'Lecture 1 Recording',
      description: 'Full recording of the first live lecture.',
      type: 'VIDEO',
      file_path: video.file_path,
      file_url: video.file_url,
      duration: 1800,
      order: 2,
      uploaded_by: owner.user_id,
      status: course.status === 'APPROVED' ? 'APPROVED' : 'PENDING'
    });
    await videoContent.save();
    allContent.push(videoContent);
  }

  console.log('Creating polls...');
  const pollDefs = [
    { teacher: users.ava, course: pythonCourse, question: 'Which topic should we cover in next week\'s live session?',
      options: ['Recursion', 'File I/O', 'Error Handling', 'Object-Oriented Programming'], active: true },
    { teacher: users.marcus, course: calculusCourse, question: 'How confident do you feel about derivatives so far?',
      options: ['Very confident', 'Somewhat confident', 'Need more practice', 'Totally lost'], active: true },
    { teacher: users.marcus, course: null, question: 'What device are you mostly using for Eduvi?',
      options: ['Laptop', 'Desktop', 'Tablet', 'Phone'], active: false }
  ];
  const polls = [];
  for (const def of pollDefs) {
    const poll = new Poll({
      question: def.question,
      options: def.options.map((text, i) => ({ option_id: `opt_${i}`, text, votes: 0 })),
      created_by: def.teacher.user_id,
      course_id: def.course ? def.course.course_id : null,
      is_active: def.active,
      voters: []
    });
    await poll.save();
    polls.push(poll);
  }
  // Cast some realistic votes via the same conditional-update path the API
  // uses, so vote counts and voter records stay consistent.
  for (const poll of polls) {
    const voters = students.slice(0, 3 + Math.floor(Math.random() * 2));
    for (const student of voters) {
      const option = poll.options[Math.floor(Math.random() * poll.options.length)];
      await Poll.updateOne(
        { poll_id: poll.poll_id, 'voters.user_id': { $ne: student.user_id } },
        {
          $inc: { 'options.$[opt].votes': 1 },
          $push: { voters: { user_id: student.user_id, option_id: option.option_id, voted_at: new Date() } }
        },
        { arrayFilters: [{ 'opt.option_id': option.option_id }] }
      );
      await awardPoints(student.user_id, POINTS.POLL_VOTE, 'Voted in a poll');
    }
  }
  await Poll.updateOne({ poll_id: polls[2].poll_id }, { $set: { closed_at: new Date() } });

  console.log('Creating whiteboard sessions...');
  const wb1 = new WhiteboardSession({
    name: 'Python Study Session - Loops & Functions',
    created_by: users.ava.user_id,
    creator_name: users.ava.name,
    course_id: pythonCourse.course_id,
    is_active: true,
    participants: [
      { user_id: users.ava.user_id, name: users.ava.name, can_draw: true },
      { user_id: users.liam.user_id, name: users.liam.name, can_draw: true },
      { user_id: users.zoe.user_id, name: users.zoe.name, can_draw: false }
    ]
  });
  await wb1.save();

  const wb2 = new WhiteboardSession({
    name: 'Calculus Office Hours (Closed)',
    created_by: users.marcus.user_id,
    creator_name: users.marcus.name,
    course_id: calculusCourse.course_id,
    is_active: false,
    participants: [{ user_id: users.marcus.user_id, name: users.marcus.name, can_draw: true }]
  });
  await wb2.save();

  console.log('Creating session chat history...');
  const demoSessionId = 'class_demo_python_session';
  const chatLines = [
    { user: users.ava, message: 'Welcome everyone! We\'ll start with a quick recap of last week\'s exercises.' },
    { user: users.liam, message: 'Sounds good, I had a question about list comprehensions.' },
    { user: users.zoe, message: 'Same here, could you show one more example?' },
    { user: users.ava, message: 'Sure - let\'s pull it up on the whiteboard.' }
  ];
  for (const [i, line] of chatLines.entries()) {
    await SessionChat.create({
      session_id: demoSessionId,
      session_type: 'video',
      user_id: line.user.user_id,
      user_name: line.user.name,
      user_picture: line.user.picture,
      message: line.message,
      created_at: new Date(Date.now() - (chatLines.length - i) * 60 * 1000)
    });
  }

  console.log('Creating AI assistant chat history...');
  const aiSessionId = `chat_${users.liam.user_id}_demo`;
  const aiTurns = [
    { role: 'user', content: 'Can you explain what a Python list comprehension is?' },
    { role: 'assistant', content: 'A list comprehension is a concise way to build a list in Python. For example, [x * 2 for x in range(5)] creates [0, 2, 4, 6, 8] in a single readable line instead of a multi-line loop.' },
    { role: 'user', content: 'Can I add a condition to it?' },
    { role: 'assistant', content: 'Yes! You can add an if clause, e.g. [x for x in range(10) if x % 2 == 0] keeps only the even numbers.' }
  ];
  for (const [i, turn] of aiTurns.entries()) {
    await ChatMessage.create({
      session_id: aiSessionId,
      user_id: users.liam.user_id,
      role: turn.role,
      content: turn.content,
      created_at: new Date(Date.now() - (aiTurns.length - i) * 60 * 1000)
    });
  }

  console.log('Creating study notes...');
  const noteDefs = [
    { user: users.liam, title: 'Python cheatsheet', content: 'Common Python snippets: string formatting, list/dict comprehensions, and common built-in functions.', is_public: true, course: pythonCourse },
    { user: users.zoe, title: 'My personal recursion notes', content: 'Private notes on how I think about recursion: base case first, then the recursive step.', is_public: false, course: dsaCourse },
    { user: users.noah, title: 'Derivative rules summary', content: 'Power rule, product rule, quotient rule, and chain rule with quick examples for each.', is_public: true, course: calculusCourse },
    { user: users.maya, title: 'CSS Flexbox quick reference', content: 'justify-content vs align-items, and when to reach for flex-wrap.', is_public: true, course: webDevCourse }
  ];
  const notes = [];
  for (const def of noteDefs) {
    const note = new StudyNote({
      user_id: def.user.user_id,
      user_name: def.user.name,
      title: def.title,
      content: def.content,
      course_id: def.course.course_id,
      is_public: def.is_public,
      file_type: 'TEXT'
    });
    await note.save();
    await trackNoteCreated(def.user.user_id);
    notes.push(note);
  }
  // Zoe shares her private recursion notes with Liam.
  await NoteCollaboration.create({
    note_id: notes[1].note_id,
    owner_id: users.zoe.user_id,
    shared_with: users.liam.user_id,
    shared_with_name: users.liam.name,
    permission_level: 'VIEW'
  });

  console.log('Skipping study groups (feature removed).');

  console.log('Simulating student progress, quizzes, and points...');
  const approvedContentByCourse = (course) => allContent.filter((c) => c.course_id === course.course_id && c.status === 'APPROVED');

  // Liam: heavy engagement -> higher tier.
  for (const content of approvedContentByCourse(pythonCourse)) {
    await trackContentCompletion(users.liam.user_id, content.content_id, 600 + Math.floor(Math.random() * 900));
  }
  for (const content of approvedContentByCourse(dsaCourse)) {
    await trackContentCompletion(users.liam.user_id, content.content_id, 500 + Math.floor(Math.random() * 700));
  }
  await trackQuizAttempt(users.liam.user_id, 'quiz_python_basics', 9, 10);
  await trackQuizAttempt(users.liam.user_id, 'quiz_data_structures', 8, 10);
  await awardPoints(users.liam.user_id, 200, 'Demo seed bonus - top contributor');

  // Zoe: moderate engagement.
  for (const content of approvedContentByCourse(dsaCourse)) {
    await trackContentCompletion(users.zoe.user_id, content.content_id, 400 + Math.floor(Math.random() * 400));
  }
  await trackQuizAttempt(users.zoe.user_id, 'quiz_data_structures', 6, 10);

  // Noah: calculus-focused.
  for (const content of approvedContentByCourse(calculusCourse)) {
    await trackContentCompletion(users.noah.user_id, content.content_id, 300 + Math.floor(Math.random() * 500));
  }
  await trackQuizAttempt(users.noah.user_id, 'quiz_derivatives', 7, 10);

  // Maya: web dev-focused, lighter engagement.
  for (const content of approvedContentByCourse(webDevCourse).slice(0, 1)) {
    await trackContentCompletion(users.maya.user_id, content.content_id, 250);
  }

  // Ethan: brand new, minimal activity (still gets a progress doc via
  // getOrCreateProgress inside these helpers so the UI has something to show).
  await trackContentCompletion(users.ethan.user_id, approvedContentByCourse(pythonCourse)[0].content_id, 120);

  console.log('Refreshing leaderboard ranks...');
  for (const [sortField, rankField] of [['points', 'overall_rank'], ['weekly_points', 'weekly_rank'], ['monthly_points', 'monthly_rank']]) {
    const entries = await LeaderboardEntry.find({}, { user_id: 1 }).sort({ [sortField]: -1 });
    await LeaderboardEntry.bulkWrite(
      entries.map((entry, index) => ({
        updateOne: { filter: { user_id: entry.user_id }, update: { $set: { [rankField]: index + 1 } } }
      }))
    );
  }

  console.log('\nDemo data seeded successfully!\n');
  console.log('Demo accounts (all use the same password):');
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(8)} ${u.email}`);
  }
  console.log('\nRun this script again any time to reset the demo data back to this state.');
};

run()
  .then(() => {
    console.log('\nDone.');
    return mongoose.connection.close();
  })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nSeed script failed:', error);
    return mongoose.connection.close().finally(() => process.exit(1));
  });
