import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Users,
  Video,
  Brain,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  PenTool,
  LineChart,
  FileText,
  CheckCircle2,
  Sparkles,
  Zap,
  Star,
  Check,
  ChevronDown,
  Play,
  ShieldCheck,
  Compass,
  GraduationCap,
  Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InlineSpinner } from '../components/PageState';
import ThemeToggle from '../components/ThemeToggle';

const easeOut = [0.23, 1, 0.32, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } }
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } }
};

const Landing = () => {
  const { handleLogin, handleRegister, error, setError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState('ai');
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STUDENT'
  });
  const authCardRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!formData.name) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await handleRegister(formData.email, formData.password, formData.name, formData.role);
      } else {
        await handleLogin(formData.email, formData.password);
      }
    } catch (err) {
      console.error('Auth error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToAuthCard = () => {
    authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const stats = [
    { value: '99.4%', label: 'Session Reliability', detail: 'Low-latency WebRTC' },
    { value: '3x', label: 'Faster Study Retention', detail: 'AI summaries & quiz loops' },
    { value: '4 Tiers', label: 'Gamified Progress', detail: 'Bronze to Platinum' },
    { value: '100%', label: 'Synchronized Whiteboard', detail: 'Multi-peer real-time' }
  ];

  const features = [
    { icon: Video, title: 'Live classrooms', desc: 'HD sessions with real-time WebRTC audio, video & interactive chat' },
    { icon: Brain, title: 'AI tutor & quizzes', desc: 'Instant contextual guidance and auto-generated practice questions' },
    { icon: Trophy, title: 'Gamification', desc: 'Points per lesson, tier progression, and competitive cohorts' },
    { icon: Users, title: 'Live polls', desc: 'Keep every classroom session engaged with instant feedback' }
  ];

  const showcaseFeatures = [
    {
      icon: BookOpen,
      title: 'Rich Courseware',
      desc: 'Structured curricula with lesson progress, embedded video lectures, PDFs, and rich markdown guides.',
      tag: 'Core'
    },
    {
      icon: PenTool,
      title: 'Live Whiteboard',
      desc: 'Multi-user collaborative canvas. Sketch math formulas, architecture diagrams, and wireframes together.',
      tag: 'Realtime'
    },
    {
      icon: Brain,
      title: 'AI Document Digest',
      desc: 'Extract concise bulleted summaries and flashcards from dense 25MB study papers or raw lecture notes.',
      tag: 'Gemini'
    },
    {
      icon: LineChart,
      title: 'Progress Tracking',
      desc: 'Visualize study streaks, completion percentages, quiz accuracy curves, and milestone badge unlocks.',
      tag: 'Analytics'
    },
    {
      icon: FileText,
      title: 'Collaborative Notes',
      desc: 'Create personal and cohort-shared study notes linked directly to course modules for easy retrieval.',
      tag: 'Workspace'
    },
    {
      icon: Trophy,
      title: 'Cohort Leaderboard',
      desc: 'Earn XP points by completing lessons, taking polls, and acing quizzes to claim the top podium spot.',
      tag: 'Gamified'
    }
  ];

  const workflowSteps = [
    {
      number: '01',
      title: 'Create Your Hive Identity',
      desc: 'Register as a Student or Teacher in under 30 seconds. Choose your learning focus and access approved courses.'
    },
    {
      number: '02',
      title: 'Explore & Enroll in Courses',
      desc: 'Browse curated curricula across programming, design, data science, and sciences with verified instructors.'
    },
    {
      number: '03',
      title: 'Collaborate in Live Classrooms',
      desc: 'Launch real-time video sessions, share interactive whiteboards, and vote on live classroom polls.'
    },
    {
      number: '04',
      title: 'Level Up With AI Tutoring',
      desc: 'Generate practice quizzes, summarize lecture texts, earn points, and climb the platform leaderboard.'
    }
  ];

  const faqs = [
    {
      q: 'How does EduHive combine live video with AI tools?',
      a: 'EduHive integrates low-latency WebRTC video classrooms with persistent session chat, interactive whiteboard rooms, and integrated AI tutoring so you can get real-time explanations without leaving your lecture.'
    },
    {
      q: 'What roles are available on EduHive?',
      a: 'Students can take courses, participate in live video rooms, earn points, and track progress. Teachers can create courses, upload lessons, host video classrooms, and monitor student engagement. Admin accounts moderate content and review approvals.'
    },
    {
      q: 'How does the point and tier system work?',
      a: 'Students earn +10 points for completing lessons, +5 points for creating study notes, +5 points for participating in polls, and up to +20 points on AI quizzes. Points unlock Bronze, Silver, Gold, and Platinum tiers on the global leaderboard.'
    },
    {
      q: 'Can teachers upload custom course materials?',
      a: 'Yes! Teachers can create courses and upload video links, PDF documents (up to 25MB), or markdown notes. Once approved by an admin, lessons are automatically published to the course catalog.'
    }
  ];

  const roleCopy = {
    STUDENT: 'Access courses, track XP, join live video rooms, and practice with AI',
    TEACHER: 'Create and manage courses, upload content, and run live classrooms'
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-body selection:bg-primary/20 selection:text-foreground">
      {/* Sticky Glass Navbar */}
      <motion.nav
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="sticky top-0 z-50 border-b border-border/80 bg-card/85 backdrop-blur-xl px-4 sm:px-8 h-16 flex items-center justify-between transition-colors duration-200"
        data-testid="landing-nav"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-amber-500 shadow-lift-sm text-primary-foreground">
            <Award size={18} strokeWidth={2.4} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight font-heading leading-tight">
              Edu<span className="text-primary">vi</span>
            </h1>
            <span className="text-[10px] text-muted-foreground font-medium -mt-1 hidden sm:inline">
              Collaborative Hive
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#demo" className="hover:text-foreground transition-colors">
            Interactive Demo
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/about"
            className="eh-btn-ghost h-9 px-3.5 text-xs font-semibold rounded-lg"
            data-testid="landing-about-link"
          >
            Guide
          </Link>
          <ThemeToggle />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              scrollToAuthCard();
            }}
            className="eh-btn-primary h-9 px-4 text-xs font-bold rounded-lg"
            data-testid="nav-auth-toggle"
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-20 border-b border-border/70">
        <div className="absolute inset-0 eh-hive-grid opacity-70 dark:opacity-25" aria-hidden />
        <div className="eh-grain" aria-hidden />
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
            
            {/* Left Hero Storytelling */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="lg:col-span-7 pt-2"
            >
              {/* Smart Badge */}
              <motion.div variants={staggerItem} className="inline-flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 shadow-lift-sm">
                  <Sparkles size={13} className="text-primary fill-primary/20" />
                  Next-Gen AI Learning Platform
                </span>
                <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                  v2.4 Live Classroom Ready
                </span>
              </motion.div>

              <motion.h1
                variants={staggerItem}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight font-heading leading-[1.08] mb-6 text-foreground"
                data-testid="hero-title"
              >
                The collaborative hive for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-500 to-amber-600">
                  serious learners
                </span>
              </motion.h1>

              <motion.p
                variants={staggerItem}
                className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 font-body leading-relaxed"
              >
                Supercharge your studies with WebRTC live video classrooms, Google Gemini AI tutoring,
                real-time collaborative whiteboards, interactive polls, and gamified XP tiers.
              </motion.p>

              {/* Action Buttons */}
              <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3.5 mb-12">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                    scrollToAuthCard();
                  }}
                  className="eh-btn-primary h-12 px-6 text-sm font-bold rounded-xl shadow-lift"
                  data-testid="hero-cta-get-started"
                >
                  Get started free
                  <ArrowRight size={16} strokeWidth={2.2} />
                </motion.button>
                <a
                  href="#demo"
                  className="eh-btn-outline h-12 px-5 text-sm font-semibold rounded-xl"
                >
                  <Play size={14} className="fill-current text-primary" />
                  Explore live demo
                </a>
              </motion.div>

              {/* Key Features Quick Row */}
              <motion.ul
                variants={staggerContainer}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/80 pt-8"
              >
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.li
                      key={index}
                      variants={staggerItem}
                      className="flex gap-3.5 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/60"
                      data-testid={`feature-card-${index}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-foreground font-heading">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground font-body mt-0.5 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </motion.div>

            {/* Right Sticky Auth Panel */}
            <motion.div
              ref={authCardRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easeOut, delay: 0.1 }}
              className="lg:col-span-5 lg:sticky lg:top-24"
            >
              <div className="eh-card-glow rounded-2xl p-6 sm:p-7 shadow-lift-lg border border-border bg-card/95 backdrop-blur-md" data-testid="auth-panel">
                
                {/* Mode Switch Tabs */}
                <div className="flex bg-muted/80 rounded-xl p-1 mb-6 border border-border/70" data-testid="auth-mode-tabs">
                  {['login', 'register'].map((mode) => {
                    const active = (mode === 'register') === isRegister;
                    return (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => {
                          setIsRegister(mode === 'register');
                          setError(null);
                        }}
                        className={`relative flex-1 py-2 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-colors ${
                          active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        data-testid={`auth-tab-${mode}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="authTabPill"
                            className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-lift-sm"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        {mode === 'login' ? 'Sign in' : 'Create Account'}
                      </button>
                    );
                  })}
                </div>

                {/* Form Heading */}
                <div className="mb-6">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={isRegister ? 'register-header' : 'login-header'}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                        {isRegister ? 'Join the Hive' : 'Welcome Back'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 font-body">
                        {isRegister
                          ? 'Start learning, earning points, and collaborating today'
                          : 'Enter your credentials to continue your study streak'}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-xl flex items-start gap-2.5">
                        <AlertCircle className="text-destructive mt-0.5 shrink-0" size={16} />
                        <p className="text-xs text-destructive font-medium font-body leading-tight">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Authentication Form */}
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={isRegister ? 'register-fields' : 'login-fields'}
                      initial={{ opacity: 0, x: isRegister ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRegister ? -10 : 10 }}
                      transition={{ duration: 0.22, ease: easeOut }}
                      className="space-y-4"
                    >
                      {isRegister && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5 font-heading">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="Alex Mercer"
                              className="eh-input text-sm rounded-xl py-2.5"
                              required={isRegister}
                              data-testid="register-name-input"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5 font-heading">
                              Select Your Role
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                              {['STUDENT', 'TEACHER'].map((role) => (
                                <button
                                  type="button"
                                  key={role}
                                  onClick={() => setFormData((prev) => ({ ...prev, role }))}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                                    formData.role === role
                                      ? 'bg-primary/10 border-primary text-primary shadow-lift-sm ring-1 ring-primary/30'
                                      : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                  }`}
                                  data-testid={`role-option-${role.toLowerCase()}`}
                                >
                                  <span>{role === 'STUDENT' ? '🎓 Student' : '👨‍🏫 Teacher'}</span>
                                  {formData.role === role && <Check size={14} className="text-primary" />}
                                </button>
                              ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1.5 font-body leading-tight">
                              {roleCopy[formData.role]}
                            </p>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5 font-heading">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="learner@eduhive.app"
                          className="eh-input text-sm rounded-xl py-2.5"
                          required
                          data-testid="email-input"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5 font-heading">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••••••"
                            className="eh-input text-sm rounded-xl py-2.5 pr-11"
                            required
                            data-testid="password-input"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            data-testid="toggle-password-visibility"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="eh-btn-primary w-full h-11 rounded-xl text-sm font-bold shadow-lift group mt-2"
                    data-testid="auth-submit-button"
                  >
                    {loading && <InlineSpinner size={16} className="text-primary-foreground" />}
                    {loading ? 'Authenticating…' : isRegister ? 'Create Free Account' : 'Sign in to EduHive'}
                    {!loading && (
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-150 group-hover:translate-x-1"
                      />
                    )}
                  </motion.button>
                </form>

                <div className="mt-5 text-center pt-4 border-t border-border/60">
                  <p className="text-xs text-muted-foreground font-body">
                    {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                    <button
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setError(null);
                        setFormData({ email: '', password: '', name: '', role: 'STUDENT' });
                      }}
                      className="text-primary font-bold hover:underline ml-1 font-heading"
                      data-testid="auth-mode-switch-link"
                    >
                      {isRegister ? 'Sign in' : 'Create one now'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Metrics Counter Strip (SmartNShine Inspired) */}
      <section className="bg-card/50 border-b border-border/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="p-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-primary tabular-nums tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs font-bold text-foreground font-heading mt-1">
                  {s.label}
                </div>
                <div className="text-[11px] text-muted-foreground font-body mt-0.5">
                  {s.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Platform Demonstration Section (Inspired by SmartNShine Live Showcase) */}
      <section id="demo" className="py-20 bg-background relative overflow-hidden border-b border-border/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eh-badge-honey mb-3">Live Experience</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading mb-3">
              Test-drive the learning platform
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body">
              Click below to explore our interactive modules before signing in.
            </p>

            {/* Interactive Demo Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 p-1.5 rounded-xl bg-card border border-border inline-flex">
              {[
                { id: 'ai', label: 'AI Tutor', icon: Brain },
                { id: 'whiteboard', label: 'Whiteboard', icon: PenTool },
                { id: 'classroom', label: 'Live Video', icon: Video },
                { id: 'polls', label: 'Class Polls', icon: Trophy }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeDemoTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemoTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-lift-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Mockup Container */}
          <div className="rounded-2xl border border-border bg-card shadow-lift-lg overflow-hidden">
            <div className="bg-muted/70 px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                <span className="text-xs font-mono text-muted-foreground ml-2">
                  eduhive.app/{activeDemoTab}-preview
                </span>
              </div>
              <span className="eh-badge-teal text-[10px]">Interactive Simulation</span>
            </div>

            <div className="p-6 sm:p-8 min-h-[360px] flex flex-col justify-center">
              {activeDemoTab === 'ai' && (
                <div className="max-w-2xl mx-auto w-full space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-bold text-xs">
                      You
                    </span>
                    <div className="bg-muted/60 p-3 rounded-xl text-xs font-body max-w-md">
                      "Can you explain how WebRTC peer connections work in EduHive live classes?"
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                      AI
                    </span>
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-xs font-body space-y-2 text-foreground">
                      <p className="font-semibold text-primary">Eduvi Gemini Tutor:</p>
                      <p>
                        WebRTC enables direct browser-to-browser audio and video streaming without routing raw media through an intermediate server. In EduHive:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Socket.IO signals connection offers, answers, and ICE candidates.</li>
                        <li>Peers establish direct peer-to-peer media tracks with DTLS encryption.</li>
                        <li>Session chat and whiteboard canvas sync seamlessly alongside the call.</li>
                      </ul>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="eh-badge-slate text-[10px] cursor-pointer hover:bg-muted">Generate Practice Quiz</span>
                        <span className="eh-badge-slate text-[10px] cursor-pointer hover:bg-muted">Save to Study Notes (+5 pts)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDemoTab === 'whiteboard' && (
                <div className="max-w-3xl mx-auto w-full border border-dashed border-border rounded-xl p-6 bg-background/50 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-muted text-[11px] font-mono font-semibold">Toolbar: Pen</span>
                    <span className="px-2 py-1 rounded bg-muted text-[11px] font-mono font-semibold">Color: Amber #f59e0b</span>
                    <span className="px-2 py-1 rounded bg-muted text-[11px] font-mono font-semibold">Stroke: 3px</span>
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-[11px] font-mono font-semibold">Room: #live-cohort-102</span>
                  </div>
                  <div className="h-44 rounded-lg bg-card border border-border flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 eh-hive-grid opacity-30" />
                    <div className="relative text-center p-4">
                      <div className="inline-block p-3 rounded-full bg-primary/10 text-primary mb-2">
                        <PenTool size={24} />
                      </div>
                      <p className="text-xs font-semibold text-foreground">Collaborative Canvas Active</p>
                      <p className="text-[11px] text-muted-foreground">4 Peers drawing in real time • PNG Export & Autosave Enabled</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDemoTab === 'classroom' && (
                <div className="max-w-3xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-border">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80"
                      alt="Instructor"
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold">
                      Dr. Sarah Chen (Instructor)
                    </div>
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-border">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                      alt="Student"
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold">
                      Alex M. (You)
                    </div>
                  </div>
                </div>
              )}

              {activeDemoTab === 'polls' && (
                <div className="max-w-xl mx-auto w-full bg-background border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Classroom Poll</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+5 XP For Voting</span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-foreground">
                    Which algorithmic paradigm offers O(V + E) for shortest paths in DAGs?
                  </h4>
                  <div className="space-y-2 pt-2">
                    {[
                      { opt: 'Dynamic Programming / Topological Sort', pct: '68%', winner: true },
                      { opt: 'Dijkstra with Fibonacci Heap', pct: '22%', winner: false },
                      { opt: 'Bellman-Ford Relaxation', pct: '10%', winner: false }
                    ].map((p, i) => (
                      <div key={i} className="relative rounded-lg border border-border overflow-hidden p-2.5">
                        <div
                          className={`absolute inset-0 ${p.winner ? 'bg-primary/20' : 'bg-muted/50'}`}
                          style={{ width: p.pct }}
                        />
                        <div className="relative flex justify-between text-xs font-semibold">
                          <span>{p.opt}</span>
                          <span className="tabular-nums font-mono">{p.pct}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid (Category Pillars) */}
      <section id="features" className="py-20 border-b border-border/80 bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="max-w-xl mb-14"
          >
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary mb-3 font-heading">
              <CheckCircle2 size={13} strokeWidth={2.5} />
              Modular Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading mb-3">
              Built for how you actually master skills
            </h2>
            <p className="text-muted-foreground font-body leading-relaxed text-sm sm:text-base">
              A consolidated workspace where courses, live classrooms, real-time collaboration, and AI tutors talk to each other.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {showcaseFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  className="eh-card-glow rounded-2xl p-6 sm:p-7 flex flex-col justify-between group"
                  data-testid={`showcase-feature-${index}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-transform duration-200 group-hover:scale-105">
                        <Icon size={20} strokeWidth={2} />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        {feature.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold tracking-tight text-foreground mb-2 font-heading">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                    <span>Learn more</span>
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Workflow Stepper Section (SmartNShine Inspired) */}
      <section id="workflow" className="py-20 bg-background border-b border-border/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="eh-badge-teal mb-3">Simple Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading mb-3">
              How learning in the Hive works
            </h2>
            <p className="text-sm text-muted-foreground">
              Four streamlined steps from sign-up to earning high leaderboard rankings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between hover:border-primary/50 transition-colors shadow-lift-sm"
              >
                <div>
                  <span className="text-3xl font-extrabold font-heading text-primary/40 block mb-3">
                    {step.number}
                  </span>
                  <h3 className="text-base font-bold font-heading text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 bg-card/30 border-b border-border/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="eh-badge-slate mb-3">Got Questions?</span>
            <h2 className="text-3xl font-extrabold tracking-tight font-heading mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground font-body">
              Everything you need to know about EduHive platform features and memberships.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-heading font-semibold text-sm text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-4 text-xs text-muted-foreground font-body leading-relaxed border-t border-border/40 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Closing CTA Banner */}
      <section className="py-16 sm:py-20 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-foreground via-slate-900 to-slate-800 text-background px-8 sm:px-12 py-12 sm:py-14 shadow-lift-lg"
          >
            <div className="absolute inset-0 eh-hive-grid opacity-20" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground mb-4">
                  <Flame size={13} /> Join 10,000+ Learners
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading mb-3 text-white">
                  Ready to accelerate your learning?
                </h2>
                <p className="text-slate-300 font-body text-sm sm:text-base leading-relaxed">
                  Join live cohorts, get instant AI guidance, master real curricula, and earn your place on the podium.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                  scrollToAuthCard();
                }}
                className="eh-btn h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold rounded-xl shadow-lift shrink-0"
                data-testid="bottom-cta-get-started"
              >
                Get started free
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Polished Multi-Column Footer */}
      <footer className="bg-card/70 border-t border-border py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Award size={16} strokeWidth={2.4} />
                </div>
                <span className="font-extrabold font-heading text-lg text-foreground">
                  Edu<span className="text-primary">vi</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-body max-w-sm leading-relaxed mb-4">
                The all-in-one collaborative AI learning platform. Connecting students, educators, and AI tools in one unified hive.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Enterprise grade security & WebRTC encryption</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-foreground mb-3">
                Learning
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground font-body">
                <li><Link to="/courses" className="hover:text-primary transition-colors">Course Catalog</Link></li>
                <li><Link to="/ai-assistant" className="hover:text-primary transition-colors">AI Tutor</Link></li>
                <li><Link to="/summary" className="hover:text-primary transition-colors">Summary Panel</Link></li>
                <li><Link to="/whiteboard" className="hover:text-primary transition-colors">Whiteboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-foreground mb-3">
                Community
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground font-body">
                <li><Link to="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
                <li><Link to="/polls" className="hover:text-primary transition-colors">Classroom Polls</Link></li>
                <li><Link to="/notes" className="hover:text-primary transition-colors">Shared Notes</Link></li>
                <li><Link to="/video-classroom" className="hover:text-primary transition-colors">Live Rooms</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-foreground mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground font-body">
                <li><Link to="/about" className="hover:text-primary transition-colors">How it works</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><span className="text-muted-foreground/60">Privacy Policy</span></li>
                <li><span className="text-muted-foreground/60">Terms of Service</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} Eduvi / EduHive Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
