import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Sheet, SheetContent } from './ui/sheet';
import ThemeToggle from './ThemeToggle';
import {
  Award,
  LayoutDashboard,
  BookOpen,
  Trophy,
  Video,
  Brain,
  BarChart3,
  Users,
  CheckCircle,
  LogOut,
  Menu,
  PenTool,
  FileText,
  Shield,
  TrendingUp,
  Sparkles,
  LineChart,
  CircleHelp,
  ChevronRight,
  Flame,
  Zap
} from 'lucide-react';

const TIER_STYLES = {
  BRONZE: { 
    text: 'text-amber-800 dark:text-amber-300', 
    bg: 'bg-amber-500/10 border-amber-500/20',
    badge: 'bg-amber-500 text-white'
  },
  SILVER: { 
    text: 'text-slate-600 dark:text-slate-300', 
    bg: 'bg-slate-400/10 border-slate-400/20',
    badge: 'bg-slate-500 text-white'
  },
  GOLD: { 
    text: 'text-yellow-800 dark:text-yellow-300', 
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    badge: 'bg-yellow-500 text-black'
  },
  PLATINUM: { 
    text: 'text-teal-800 dark:text-teal-300', 
    bg: 'bg-teal-500/10 border-teal-500/20',
    badge: 'bg-teal-500 text-white'
  }
};
const getTierStyle = (tier) => TIER_STYLES[tier] || TIER_STYLES.SILVER;

const easeOut = [0.23, 1, 0.32, 1];

const NavGroup = ({ title, items, location, onNavigate, testIdPrefix }) => {
  if (!items.length) return null;
  return (
    <div className="py-2">
      {title && (
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 font-heading">
          {title}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              data-testid={`${testIdPrefix}-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm font-medium font-body transition-all duration-150 ${
                isActive
                  ? 'text-primary-foreground font-semibold shadow-lift-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={`${testIdPrefix}-active-pill`}
                  className="absolute inset-0 rounded-[10px] bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2.5 truncate">
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  className={`shrink-0 transition-transform duration-150 ${
                    isActive ? '' : 'group-hover:translate-x-0.5 group-hover:text-primary'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="relative z-10 flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : item.badgeColor || 'bg-primary/15 text-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const UserFooterCard = ({ user, logout, testIdPrefix = 'sidebar' }) => {
  const isStudent = user?.role === 'STUDENT';
  const tier = getTierStyle(user?.tier);
  return (
    <div className="p-3 border-t border-border bg-card/50">
      <div className={`p-3 rounded-xl border transition-all ${isStudent ? tier.bg : 'bg-muted/40 border-border/70'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-9 h-9 rounded-full ring-2 ring-background object-cover"
            />
            {isStudent && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                <Flame size={10} />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate font-heading">{user?.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground capitalize font-body">
                {user?.role?.toLowerCase()}
              </span>
              {isStudent && user?.tier && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${tier.text}`}>
                  • {user?.tier}
                </span>
              )}
            </div>
          </div>
        </div>
        {isStudent && (
          <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap size={11} className="text-primary fill-primary" /> XP Score
            </span>
            <span className="font-bold tabular-nums font-heading text-primary">{user?.points ?? 0} pts</span>
          </div>
        )}
      </div>
      <button
        onClick={logout}
        data-testid={`${testIdPrefix}-logout`}
        className="eh-btn-ghost w-full mt-2 py-2 text-xs font-semibold rounded-[10px] hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut size={14} strokeWidth={2} />
        <span>Sign out</span>
      </button>
    </div>
  );
};

const BrandMark = ({ size = 30, textClass = 'text-lg', showBadge = true }) => (
  <span className="flex items-center gap-2.5 group">
    <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-amber-500 p-2 text-primary-foreground shadow-lift-sm transition-transform duration-200 group-hover:scale-105 active:scale-95">
      <Award size={size - 12} strokeWidth={2.4} />
      <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="flex flex-col">
      <span className={`${textClass} font-extrabold tracking-tight font-heading text-foreground leading-none flex items-center gap-1`}>
        Edu<span className="text-primary">vi</span>
        {showBadge && (
          <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            HIVE
          </span>
        )}
      </span>
      <span className="text-[10px] text-muted-foreground font-body font-medium tracking-tight mt-0.5">
        AI Learning Platform
      </span>
    </div>
  </span>
);

const AppLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const isStudent = user?.role === 'STUDENT';
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const coreItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: CircleHelp, label: 'How it works', path: '/about' }
  ];

  const aiAndTools = [
    { icon: Video, label: 'Live Class', path: '/video-classroom', isLive: true },
    { icon: Brain, label: 'AI Assistant', path: '/ai-assistant', badge: 'AI' },
    { icon: Sparkles, label: 'Summary Panel', path: '/summary' },
    { icon: PenTool, label: 'Whiteboard', path: '/whiteboard' },
    { icon: FileText, label: 'Study Notes', path: '/notes' }
  ];

  const gamificationItems = [
    ...(isStudent || isAdmin ? [{ icon: Trophy, label: 'Leaderboard', path: '/leaderboard' }] : []),
    ...(isStudent || isAdmin ? [{ icon: BarChart3, label: 'Polls', path: '/polls' }] : []),
    ...(isStudent ? [{ icon: LineChart, label: 'Progress', path: '/progress' }] : [])
  ];

  const managementItems = [];
  if (isTeacherOrAdmin) {
    managementItems.push({ icon: Users, label: 'My Courses', path: '/teacher/courses' });
  }
  if (isAdmin) {
    managementItems.push({ icon: CheckCircle, label: 'Approvals', path: '/admin/approvals', badge: 'Admin' });
    managementItems.push({ icon: Shield, label: 'Manage Users', path: '/admin/users' });
    managementItems.push({ icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' });
  }

  const tier = getTierStyle(user?.tier);
  const isStudentUser = user?.role === 'STUDENT';

  return (
    <div className="min-h-screen bg-background text-foreground flex antialiased">
      {/* Desktop Fixed Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-[16rem] bg-card/95 backdrop-blur-md border-r border-border fixed h-full z-40 transition-colors duration-200"
        data-testid="sidebar"
      >
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <Link to="/dashboard" className="focus:outline-none">
            <BrandMark />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-2" aria-label="Main navigation">
          <NavGroup
            title="Overview"
            items={coreItems}
            location={location}
            testIdPrefix="nav"
          />
          <NavGroup
            title="Interactive & AI"
            items={aiAndTools}
            location={location}
            testIdPrefix="nav"
          />
          {gamificationItems.length > 0 && (
            <NavGroup
              title="Social & Ranks"
              items={gamificationItems}
              location={location}
              testIdPrefix="nav"
            />
          )}
          {managementItems.length > 0 && (
            <NavGroup
              title="Management"
              items={managementItems}
              location={location}
              testIdPrefix="nav"
            />
          )}
        </nav>

        <UserFooterCard user={user} logout={logout} testIdPrefix="sidebar" />
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="p-0 w-80 bg-card border-r border-border flex flex-col gap-0"
          data-testid="mobile-sidebar"
        >
          <div className="px-5 py-4 border-b border-border">
            <Link to="/dashboard">
              <BrandMark size={28} textClass="text-lg" />
            </Link>
          </div>
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-2">
            <NavGroup
              title="Overview"
              items={coreItems}
              location={location}
              onNavigate={() => setMobileNavOpen(false)}
              testIdPrefix="mobile-nav"
            />
            <NavGroup
              title="Interactive & AI"
              items={aiAndTools}
              location={location}
              onNavigate={() => setMobileNavOpen(false)}
              testIdPrefix="mobile-nav"
            />
            {gamificationItems.length > 0 && (
              <NavGroup
                title="Social & Ranks"
                items={gamificationItems}
                location={location}
                onNavigate={() => setMobileNavOpen(false)}
                testIdPrefix="mobile-nav"
              />
            )}
            {managementItems.length > 0 && (
              <NavGroup
                title="Management"
                items={managementItems}
                location={location}
                onNavigate={() => setMobileNavOpen(false)}
                testIdPrefix="mobile-nav"
              />
            )}
          </nav>
          <UserFooterCard user={user} logout={logout} testIdPrefix="mobile-sidebar" />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[16rem] min-w-0 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <header
          className="bg-card/85 backdrop-blur-xl border-b border-border/80 px-4 sm:px-6 h-15 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200"
          data-testid="top-nav"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-foreground hover:bg-muted/80 transition-colors active:scale-95 border border-border/60"
              data-testid="mobile-menu-button"
              aria-label="Open navigation menu"
            >
              <Menu size={19} strokeWidth={2} />
            </button>
            <div className="lg:hidden">
              <Link to="/dashboard">
                <BrandMark size={26} textClass="text-base" showBadge={false} />
              </Link>
            </div>
            {title && (
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground font-medium font-body">EduHive</span>
                <ChevronRight size={14} className="text-muted-foreground/60" />
                <h1 className="text-base font-bold tracking-tight text-foreground truncate font-heading">
                  {title}
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/video-classroom"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Room</span>
            </Link>

            <ThemeToggle />

            <div
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                isStudentUser ? tier.bg : 'bg-muted/40 border-border'
              }`}
            >
              <img
                src={user?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt=""
                className="w-7 h-7 rounded-full ring-1 ring-border object-cover"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground truncate max-w-[8.5rem] font-heading leading-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize leading-none">
                  {user?.role?.toLowerCase()}
                </span>
              </div>
              {isStudentUser && (
                <span className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-primary text-primary-foreground shadow-lift-sm">
                  {user?.points ?? 0}
                </span>
              )}
            </div>
          </div>
        </header>

        {title && (
          <div className="lg:hidden px-4 sm:px-6 pt-4">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-heading">
              {title}
            </h1>
          </div>
        )}

        {/* Content with smooth animated entry */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: easeOut }}
          className="p-4 sm:p-6 md:p-8 flex-1"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default AppLayout;
