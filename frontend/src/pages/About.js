import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Video,
  Brain,
  PenTool,
  FileText,
  Trophy,
  BarChart3,
  LineChart,
  Sparkles,
  Users,
  Shield,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Vote,
  Upload,
  MessageSquare,
  Sparkle
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../components/ui/accordion';

const easeOut = [0.23, 1, 0.32, 1];

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'guide', label: 'How to use' },
  { id: 'deep-dive', label: 'Deep dive' },
  { id: 'journey', label: 'Example' },
  { id: 'faq', label: 'FAQ' }
];

const FEATURES = [
  {
    icon: BookOpen,
    name: 'Courses',
    path: '/courses',
    explanation: 'Browse approved courses by category, then open videos, PDFs, and written notes in one place.',
    useful: 'Keeps lessons structured so you always know what to study next.'
  },
  {
    icon: Video,
    name: 'Live Class',
    path: '/video-classroom',
    explanation: 'Teachers and admins start a session and share a class ID. Students join with camera, mic, and in-session chat.',
    useful: 'Turns remote learning into a real classroom, not a one-way video.'
  },
  {
    icon: PenTool,
    name: 'Whiteboard',
    path: '/whiteboard',
    explanation: 'Create or join a shared board. Draw, type, and sketch together with live updates and autosave.',
    useful: 'Makes problem-solving visible during class instead of describing it in chat.'
  },
  {
    icon: Brain,
    name: 'AI Assistant',
    path: '/ai-assistant',
    explanation: 'Three tools: AI Tutor chat about Eduvi and your learning, a text summarizer, and a quiz generator.',
    useful: 'Gives you help, recap, and practice without leaving the hive.'
  },
  {
    icon: Sparkles,
    name: 'Summary Panel',
    path: '/summary',
    explanation: 'Paste study text or upload a PDF (up to 25MB). Get a structured summary you can copy or download.',
    useful: 'Cuts long readings into key points you can actually review.'
  },
  {
    icon: FileText,
    name: 'Study Notes',
    path: '/notes',
    explanation: 'Write private notes, publish community notes, share with a classmate, and attach files.',
    useful: 'Your notes stay with the course work instead of scattered across apps.'
  },
  {
    icon: BarChart3,
    name: 'Polls',
    path: '/polls',
    explanation: 'Students and admins create live polls. Students vote once; results update in real time. Voting awards 5 points.',
    useful: 'Checks understanding during class without interrupting the session.'
  },
  {
    icon: Trophy,
    name: 'Leaderboard',
    path: '/leaderboard',
    explanation: 'Students rank by All Time, This Week, and This Month. Tiers: Bronze, Silver, Gold, Platinum.',
    useful: 'Makes progress visible and gives a reason to keep a study streak.'
  },
  {
    icon: LineChart,
    name: 'Progress',
    path: '/progress',
    explanation: 'Students see completed content, quiz attempts, streaks, time spent, and badges such as First Steps and Bookworm.',
    useful: 'Shows what you finished — not just what you enrolled in.'
  }
];

const WORKFLOW = [
  {
    step: '01',
    title: 'Create an account',
    body: 'Sign up as a Student or Teacher on the home page. Admin accounts are created separately — you cannot self-register as Admin.'
  },
  {
    step: '02',
    title: 'Land on Dashboard',
    body: 'After sign-in you go to Dashboard: your points and tier (students), shortcuts, recent courses, and top learners.'
  },
  {
    step: '03',
    title: 'Learn or teach',
    body: 'Students open Courses and complete lessons. Teachers use My Courses to create a course and upload Video, PDF, or Markdown content. New material waits for admin approval before it appears in the catalog.'
  },
  {
    step: '04',
    title: 'Meet live',
    body: 'A teacher starts Live Class, copies the session ID, and students join. Use Whiteboard in parallel for diagrams. Polls collect votes during the session.'
  },
  {
    step: '05',
    title: 'Study, then measure',
    body: 'Save Study Notes, ask the AI Assistant, or summarize a PDF. Completing content (+10), notes (+5), polls (+5), and quizzes (up to +20) raise student points and badges. Check Progress and Leaderboard.'
  }
];

const GUIDE = [
  {
    title: 'Get started',
    expect: 'You are signed in and sent to Dashboard.',
    items: [
      'Open the home page and choose Sign up.',
      'Enter name, email, password, and Student or Teacher.',
      'Sign in later from the same form.'
    ]
  },
  {
    title: 'Do this first',
    expect: 'You know where your tools live and have opened at least one course.',
    items: [
      'Scan Dashboard shortcuts — they match the left sidebar.',
      'Open Courses, search or filter by category, and pick a course.',
      'Teachers: open My Courses and create your first course (it stays Pending until an admin approves it).'
    ]
  },
  {
    title: 'Use the important tools',
    expect: 'You can study asynchronously and join live work when a class is running.',
    items: [
      'In a course, open a video, PDF, or note. Students: watching or opening content records progress.',
      'Live Class: hosts generate a session ID; everyone else pastes it to join.',
      'Whiteboard: create a board or open an existing session, then draw if you have permission.',
      'AI Assistant: Tutor for questions, Summarizer for text, Quiz Generator for practice.',
      'Summary Panel: paste text or upload a PDF when you need a longer digest.',
      'Study Notes: write a note, keep it private, make it public, or share it with a user ID.'
    ]
  },
  {
    title: 'What happens after each action',
    expect: 'Points, ranks, and badges only change for students, and only for real activity.',
    items: [
      'Complete a lesson item → +10 points, content marked done, streak may update.',
      'Create a study note → +5 points.',
      'Vote in a poll → +5 points; you cannot vote twice.',
      'Finish an AI quiz → up to +20 points based on score.',
      'Tiers move at 500 (Silver), 2000 (Gold), and 5000 (Platinum).'
    ]
  }
];

const DEEP_DIVES = [
  {
    icon: GraduationCap,
    title: 'Roles decide what you see',
    body: 'The sidebar is not the same for everyone. Students get Leaderboard, Polls, and Progress. Teachers get My Courses and can host Live Class, but they do not earn points or appear on the student leaderboard. Admins also get Approvals, Manage Users, and Analytics.'
  },
  {
    icon: Upload,
    title: 'Courses need approval',
    body: 'Teachers create a course with title, description, category, and optional thumbnail, then upload Video, PDF, or Markdown files. Status is Pending until an admin approves it in Approvals. Rejected items stay visible to the teacher so they can see what was blocked.'
  },
  {
    icon: MessageSquare,
    title: 'Live Class is a room, not a calendar',
    body: 'There is no built-in timetable. The host generates a class ID, copies it, and shares it. Inside the room you can mute audio or video, open chat, see participants, and leave. Hosts can also end the session for everyone.'
  },
  {
    icon: Vote,
    title: 'How points are actually earned',
    body: 'Points are awarded by the server, not typed in by students. Poll vote 5, content complete 10, note created 5, quiz up to 20. Teachers and admins never receive these awards. Leaderboard tabs use overall, weekly, and monthly totals.'
  }
];

const FAQ = [
  {
    q: 'What is Eduvi?',
    a: 'Eduvi is a collaborative learning workspace. Students take courses, join live class, take notes, and earn points. Teachers publish courses and host sessions. Admins approve content and manage the hive.'
  },
  {
    q: 'Can I register as an admin?',
    a: 'No. Sign-up only offers Student and Teacher. Admin accounts are provisioned separately.'
  },
  {
    q: 'Why don’t I see Leaderboard, Polls, or Progress?',
    a: 'Those pages are for students (and Leaderboard/Polls also for admins). Teachers are focused on creating and running classes, so those student tools are hidden from their sidebar.'
  },
  {
    q: 'Why is my new course not in the catalog?',
    a: 'New courses and uploads start as Pending. An admin must approve them in Approvals before students can browse them on Courses.'
  },
  {
    q: 'How do I join a live class?',
    a: 'Open Live Class, paste the session ID your teacher shared, and join. Allow camera and microphone when the browser asks. You can still join with audio only if video permission is denied.'
  },
  {
    q: 'Who can draw on the whiteboard?',
    a: 'The session creator can draw. Other people can join and watch; drawing permission is controlled by the session. The board autosaves about every 1.5 seconds while you draw.'
  },
  {
    q: 'What is the difference between AI Assistant and Summary Panel?',
    a: 'AI Assistant is for short tutor chat, a quick text summary, and generating a quiz. Summary Panel is built for longer work: paste a large block of text or upload a PDF up to 25MB, then copy or download the result.'
  },
  {
    q: 'Are my study notes private?',
    a: 'By default, yes — they appear under My Notes. You can mark a note public (Community Notes) or share it with a specific user as view-only.'
  },
  {
    q: 'Do teachers appear on the leaderboard?',
    a: 'No. Points, tiers, and ranks are student-only so teaching work is not mixed with student scores.'
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-amber-500 shadow-lift-sm text-primary-foreground transition-transform group-hover:scale-105">
        <Award size={16} strokeWidth={2.4} />
      </div>
      <span className="text-lg font-extrabold tracking-tight font-heading text-foreground">
        Edu<span className="text-primary">vi</span>
      </span>
    </Link>
  );
}

function SectionNav({ active }) {
  return (
    <nav
      aria-label="On this page"
      className="sticky top-16 z-20 -mx-4 sm:mx-0 mb-8 border-b border-border/80 bg-background/85 backdrop-blur-xl"
    >
      <div className="flex gap-1.5 overflow-x-auto px-4 sm:px-0 py-2.5 scrollbar-thin">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`shrink-0 h-8 px-3.5 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-all duration-150 ${
              active === s.id
                ? 'bg-primary text-primary-foreground shadow-lift-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function HiveVisual() {
  return (
    <div className="relative eh-card-glow rounded-2xl overflow-hidden p-6 sm:p-7 shadow-lift border border-border">
      <div className="absolute inset-0 eh-hive-grid opacity-50 dark:opacity-20" aria-hidden />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <span className="eh-badge-honey text-[10px]">Realtime Platform</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Active Cohort
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {['You (Student)', 'Asha (Peer)', 'Dr. Rao (Host)'].map((name, i) => (
            <div
              key={name}
              className={`rounded-xl border border-border bg-muted/50 p-3 transition-colors ${
                i === 2 ? 'border-primary/40 bg-primary/5' : ''
              }`}
            >
              <div className="h-10 rounded-lg bg-foreground/10 mb-2 flex items-center justify-center">
                <Video size={16} className="text-muted-foreground" />
              </div>
              <p className="text-[11px] font-bold truncate font-heading">{name}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['Courses', 'Whiteboard', 'AI Summaries', '+10 XP Completion'].map((chip) => (
            <span
              key={chip}
              className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold"
            >
              {chip}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/60">
          One unified hive: catalog, live video room, collaborative board, and scoring — not fragmented across multiple apps.
        </p>
      </div>
    </div>
  );
}

function AboutBody({ isAuthenticated, user, ctaHref, ctaLabel }) {
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.15, 0.4] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <SectionNav active={active} />

      <section className="relative overflow-hidden mb-16 sm:mb-20">
        <div className="absolute inset-0 eh-hive-grid opacity-40 dark:opacity-20 pointer-events-none" aria-hidden />
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="lg:col-span-7"
          >
            <motion.div variants={fadeUp} className="mb-3">
              <span className="eh-badge-honey">How Eduvi Works</span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-3xl sm:text-4xl lg:text-[2.85rem] font-extrabold font-heading tracking-tight leading-[1.1] mb-4 text-foreground"
              data-testid="about-hero-title"
            >
              A collaborative hive for courses, live classes, and real progress
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-6 font-body">
              Eduvi brings together learning materials, real-time video sessions, collaborative whiteboards, smart AI summaries, and a gamified XP leaderboard that only rewards genuine academic achievement.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link to={ctaHref} className="eh-btn-primary h-11 px-6 rounded-xl font-bold shadow-lift" data-testid="about-hero-cta">
                {ctaLabel}
                <ArrowRight size={16} />
              </Link>
              <a href="#guide" className="eh-btn-outline h-11 px-5 rounded-xl font-semibold">
                Step-by-step guide
              </a>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <HiveVisual />
          </motion.div>
        </div>
      </section>

      <section id="overview" className="scroll-mt-28 mb-16 sm:mb-20">
        <p className="eh-meta mb-1 uppercase tracking-wider text-primary font-bold">Platform Overview</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-6 tracking-tight">What is Eduvi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'In Simple Terms',
              body: 'Eduvi is an online classroom and personalized study desk in one. You master courses at your own pace, join interactive live video calls when cohort meets, and keep smart notes and summaries right beside the material.'
            },
            {
              title: 'The Friction It Resolves',
              body: 'Learning is usually fragmented across video conference links, scattered drive folders, external quiz tools, and Discord chats. Eduvi keeps course content, whiteboard rooms, polls, and XP tracking inside a single interface.'
            },
            {
              title: 'Built For Dedicated Roles',
              body: 'Students who want verified skills and an authentic score. Teachers who create Video, PDF, and Markdown curricula and host classrooms. Admins who approve courses, moderate users, and monitor metrics.'
            }
          ].map((block) => (
            <div key={block.title} className="eh-card-glow rounded-2xl p-6 sm:p-7 shadow-lift-sm">
              <h3 className="font-heading font-bold text-base mb-2.5 text-foreground">{block.title}</h3>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">{block.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-28 mb-16 sm:mb-20">
        <p className="eh-meta mb-1 uppercase tracking-wider text-secondary font-bold">Supported Features</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-3 tracking-tight">Platform Capabilities</h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mb-8 font-body">
          Every tool below is active and supported in Eduvi today. Some features are role-gated based on Student, Teacher, or Admin permissions.
        </p>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const role = user?.role;
            let to = '/';
            if (isAuthenticated) {
              if (f.path === '/leaderboard' || f.path === '/polls') {
                to = role === 'STUDENT' || role === 'ADMIN' ? f.path : '/dashboard';
              } else if (f.path === '/progress') {
                to = role === 'STUDENT' ? f.path : '/dashboard';
              } else {
                to = f.path;
              }
            }
            return (
              <motion.div key={f.name} variants={fadeUp}>
                <Link
                  to={to}
                  className="eh-card-glow rounded-2xl p-6 h-full flex flex-col justify-between group shadow-lift-sm"
                  data-testid={`about-feature-${f.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-4 transition-transform group-hover:scale-105">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <h3 className="font-heading font-bold text-base mb-1.5 group-hover:text-primary transition-colors text-foreground">
                      {f.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body leading-relaxed mb-4">{f.explanation}</p>
                  </div>
                  <div className="text-[11px] font-semibold text-foreground/80 bg-muted/60 rounded-xl p-2.5 border border-border/50">
                    <span className="text-primary font-bold">Why it helps:</span> {f.useful}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
        <div className="eh-card-glow rounded-2xl mt-4 p-5 sm:p-6 bg-muted/30">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield size={18} strokeWidth={2} />
            </span>
            <div>
              <h3 className="font-heading font-bold text-sm mb-1 text-foreground">Administrative Governance</h3>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                Admins have dedicated interfaces for Content Approvals (moderating courses, PDFs, and video links), User Management (role provisioning), and Activity Analytics (cohort engagement metrics).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28 mb-16 sm:mb-20">
        <p className="eh-meta mb-1 uppercase tracking-wider text-primary font-bold">System Architecture</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-8 tracking-tight">The 5-Step Learning Loop</h2>
        <ol className="relative space-y-0">
          {WORKFLOW.map((item, i) => (
            <li key={item.step} className="relative grid grid-cols-[auto_1fr] gap-4 sm:gap-6 pb-8 last:pb-0">
              {i < WORKFLOW.length - 1 && (
                <span className="absolute left-[19px] top-11 bottom-0 w-px bg-border/80" aria-hidden />
              )}
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold font-mono shadow-lift-sm">
                {item.step}
              </span>
              <div className="pt-1.5">
                <h3 className="font-heading font-bold text-base mb-1 text-foreground">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-body leading-relaxed max-w-2xl">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="guide" className="scroll-mt-28 mb-16 sm:mb-20">
        <p className="eh-meta mb-1 uppercase tracking-wider text-teal-600 font-bold">Practical Checklist</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-3 tracking-tight">Step-By-Step Onboarding</h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mb-8 font-body">
          Follow these guidelines when entering the platform. Once set up, daily work flows from your Dashboard.
        </p>
        <div className="space-y-4">
          {GUIDE.map((block, i) => (
            <div key={block.title} className="eh-card-glow rounded-2xl p-6 shadow-lift-sm">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-bold font-mono shadow-lift-sm">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-bold text-base mb-2 text-foreground">{block.title}</h3>
                  <ul className="space-y-2 mb-4">
                    {block.items.map((line) => (
                      <li key={line} className="flex gap-2.5 text-xs text-muted-foreground font-body leading-relaxed">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs font-semibold bg-muted/60 text-foreground rounded-xl px-3.5 py-2.5 border border-border/50">
                    <span className="text-primary font-bold">Expected Result:</span> {block.expect}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="deep-dive" className="scroll-mt-28 mb-16 sm:mb-20">
        <p className="eh-meta mb-1 uppercase tracking-wider text-amber-600 font-bold">Under The Hood</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-8 tracking-tight">Role & Architecture Deep Dive</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {DEEP_DIVES.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.title} className="eh-card-glow rounded-2xl p-6 shadow-lift-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-3">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <h3 className="font-heading font-bold text-base mb-2 text-foreground">{d.title}</h3>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">{d.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="journey" className="scroll-mt-28 mb-16 sm:mb-20">
        <p className="eh-meta mb-1 uppercase tracking-wider text-primary font-bold">Scenario Walkthrough</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-3 tracking-tight">A Realistic Study Week</h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mb-8 font-body">
          Maya is a student preparing for distributed systems. Priya is her cohort instructor. Here is their verified workflow on Eduvi.
        </p>
        <div className="eh-card-glow rounded-2xl overflow-hidden divide-y divide-border shadow-lift-sm">
          {[
            {
              who: 'Monday — Curriculum Upload (Priya)',
              text: 'Priya opens My Courses, creates “Distributed Architectures,” and uploads video lessons plus slides. The course is placed in Pending state until an admin verifies and approves the curriculum.'
            },
            {
              who: 'Tuesday — Self-Paced Completion (Maya)',
              text: 'Maya logs in, lands on Dashboard, opens Courses, and completes lesson 1. Her progress tracker logs the completion, granting +10 XP and unlocking her "First Steps" milestone badge.'
            },
            {
              who: 'Wednesday — Live WebRTC Classroom (Cohort)',
              text: 'Priya launches Live Class and shares the session ID. Maya connects via camera and audio. They sketch consensus diagrams together on the live Whiteboard and answer a live poll for +5 XP.'
            },
            {
              who: 'Thursday — AI Digest & Quiz Loop (Maya)',
              text: 'Maya uploads the lecture PDF into the Summary Panel for an executive digest, asks the AI Tutor follow-up questions, and tests herself with the AI Quiz Generator for up to +20 points.'
            },
            {
              who: 'Friday — Weekly Standings & Badges',
              text: 'Maya checks Progress to inspect her streak and checks the Leaderboard to see her rank advance towards Gold tier. Priya reviews student analytics and engagement rates in My Courses.'
            }
          ].map((row) => (
            <div key={row.who} className="p-5 sm:px-6 sm:py-5 hover:bg-muted/30 transition-colors">
              <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1 font-heading">{row.who}</p>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">{row.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="scroll-mt-28 mb-16 sm:mb-20">
        <p className="eh-meta mb-1 uppercase tracking-wider text-muted-foreground font-bold">Clarifications</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-6 tracking-tight">Platform FAQ</h2>
        <Accordion type="single" collapsible className="eh-card-glow rounded-2xl px-6 divide-y divide-border/60 shadow-lift-sm">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="border-border/60 py-1">
              <AccordionTrigger className="font-heading font-bold text-sm sm:text-base py-4 hover:no-underline text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground font-body leading-relaxed pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl bg-gradient-to-tr from-foreground via-slate-900 to-slate-800 text-background px-8 sm:px-12 py-10 sm:py-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 shadow-lift-lg">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground mb-3 font-heading">
            Next Action
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-2 text-white tracking-tight">
            {isAuthenticated ? 'Return to your dashboard' : 'Join the learning hive'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md font-body leading-relaxed">
            {isAuthenticated
              ? 'Jump right back into active courses, collaborative whiteboards, or AI practice.'
              : 'Create your Student or Teacher account in 30 seconds and start learning today.'}
          </p>
        </div>
        <Link to={ctaHref} className="eh-btn h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-sm shadow-lift shrink-0" data-testid="about-bottom-cta">
          {ctaLabel}
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

function PublicChrome({ children }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-body">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-card/85 backdrop-blur-xl px-4 sm:px-8 h-16 flex items-center justify-between">
        <BrandMark />
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link to="/" className="eh-btn-primary h-9 px-4 text-xs font-bold rounded-lg shadow-lift-sm" data-testid="about-nav-signin">
            Sign in
          </Link>
        </div>
      </header>
      <main className="px-4 sm:px-8 pt-8">{children}</main>
      <footer className="border-t border-border mt-12 py-8 bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandMark />
          <p className="text-xs text-muted-foreground font-body">
            &copy; {new Date().getFullYear()} Eduvi / EduHive Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

const About = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const ctaHref = isAuthenticated ? '/dashboard' : '/';
  const ctaLabel = isAuthenticated ? 'Go to Dashboard' : 'Get started';

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <p className="eh-meta">Loading platform documentation…</p>
      </div>
    );
  }

  const body = (
    <AboutBody
      isAuthenticated={isAuthenticated}
      user={user}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
    />
  );

  if (isAuthenticated) {
    return <AppLayout title="How it works">{body}</AppLayout>;
  }

  return <PublicChrome>{body}</PublicChrome>;
};

export default About;
