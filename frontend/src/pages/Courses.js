import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import AppLayout from '../components/AppLayout';
import { EmptyState } from '../components/PageState';
import { Skeleton } from '../components/ui/skeleton';
import { BookOpen, Search, Users as UsersIcon, Clock3, ArrowRight, Sparkles, Filter, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } }
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(courses.map((c) => c.category).filter(Boolean))];

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor_name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || c.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <AppLayout title="Courses">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="eh-badge-honey text-[10px]">Curriculum Catalog</span>
              <span className="text-xs text-muted-foreground">• {courses.length} Approved Courses</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="courses-title"
            >
              Explore Knowledge Streams
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-body mt-1">
              Curated lecture series, lecture PDFs, and collaborative coursework
            </p>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.05, ease: easeOut }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by topic, instructor, or keywords…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="course-search-input"
              className="eh-input pl-10 pr-9 text-sm rounded-xl py-2.5"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            {categories.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  data-testid={`filter-${cat.toLowerCase()}`}
                  className={`relative h-10 px-4 rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition-all duration-150 ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-lift-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="eh-panel rounded-2xl overflow-hidden p-0">
                <Skeleton className="w-full h-44 rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses found"
            description="Try clearing your search or picking a different category filter."
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((course) => (
              <motion.button
                type="button"
                key={course.course_id}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/courses/${course.course_id}`)}
                data-testid={`course-card-${course.course_id}`}
                className="group eh-card-glow rounded-2xl overflow-hidden text-left flex flex-col justify-between shadow-lift-sm"
              >
                <div>
                  <div className="overflow-hidden relative h-44 bg-slate-900">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                        {course.category}
                      </span>
                      {course.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/80 backdrop-blur-md text-black inline-flex items-center gap-1">
                          <Clock3 size={11} />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold font-heading text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 font-body leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate font-medium font-body">by {course.instructor_name}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-medium font-body">
                      <UsersIcon size={13} strokeWidth={1.8} />
                      <span className="tabular-nums">{course.enrolled_students || 0}</span>
                    </div>
                    <span className="text-primary font-bold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Open <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Courses;
