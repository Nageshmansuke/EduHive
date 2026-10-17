import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../components/ui/alert-dialog';
import {
  Trash2,
  Loader2,
  UserX,
  Search,
  Shield,
  GraduationCap,
  Users as UsersIcon,
  Sparkles,
  Award,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const ROLE_CONFIG = {
  STUDENT: {
    label: 'Student',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    icon: GraduationCap
  },
  TEACHER: {
    label: 'Teacher',
    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
    icon: UsersIcon
  },
  ADMIN: {
    label: 'Admin',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: Shield
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
      setUsers(res.data);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await axios.patch(`${API_URL}/api/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      fetchUsers();
    } catch (error) {
      console.error('Update role error:', error);
      alert(error.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDelete = async (userId, name) => {
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, { withCredentials: true });
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = {
    STUDENT: users.filter(u => u.role === 'STUDENT').length,
    TEACHER: users.filter(u => u.role === 'TEACHER').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length
  };

  return (
    <AppLayout title="User Management">
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
              <Shield size={13} className="text-primary" />
              <span>Platform Administration & Access Control</span>
            </div>
            <h2
              className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="admin-users-title"
            >
              User Management
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body mt-1 max-w-xl">
              Inspect registered accounts, reassign student and teacher roles, review gamification tiers, and manage memberships.
            </p>
          </div>
        </motion.div>

        {/* Role Distribution Metric Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <motion.div
                key={role}
                variants={itemVariants}
                className="eh-panel p-5 rounded-2xl border border-border/80 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <p className="text-xs text-muted-foreground font-body font-semibold">{config.label}s</p>
                  <p className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight tabular-nums text-foreground mt-1">
                    {roleCounts[role]}
                  </p>
                </div>
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${config.badge}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={16}
            strokeWidth={2}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search users by name, email, or platform role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="user-search-input"
            className="eh-input pl-11 pr-10 h-11 text-xs sm:text-sm rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* User Directory Table */}
        {loading ? (
          <LoadingState label="Querying user database..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UserX}
            title="No users found"
            description="No user matches your search query. Try clearing the filter."
          />
        ) : (
          <div className="eh-panel rounded-2xl overflow-hidden border border-border/80 shadow-sm">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider font-heading">
              <div className="col-span-5">Member</div>
              <div className="col-span-3">Role Designation</div>
              <div className="col-span-2">Gamification</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="eh-divider-list"
            >
              {filtered.map((u) => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.STUDENT;
                const isUpdating = updatingRole === u.user_id;

                return (
                  <motion.div
                    key={u.user_id}
                    variants={itemVariants}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-4 px-5 sm:px-6 py-4 items-center hover:bg-muted/30 transition-colors duration-150"
                    data-testid={`user-row-${u.user_id}`}
                  >
                    {/* User Identity */}
                    <div className="col-span-2 sm:col-span-5 flex items-center gap-3 min-w-0">
                      <img
                        src={u.picture}
                        alt=""
                        className="w-10 h-10 rounded-full ring-2 ring-border shrink-0 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold font-heading text-foreground truncate">
                          {u.name}
                        </p>
                        <p className="text-xs font-body text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Role Selector */}
                    <div className="col-span-1 sm:col-span-3 flex items-center gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                        disabled={isUpdating}
                        data-testid={`role-select-${u.user_id}`}
                        className={`text-xs font-bold font-body px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer ${rc.badge}`}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TEACHER">Teacher</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {isUpdating && (
                        <Loader2 size={14} className="animate-spin text-primary shrink-0" />
                      )}
                    </div>

                    {/* Gamification Points & Tier */}
                    <div className="col-span-1 sm:col-span-2">
                      {u.role === 'STUDENT' ? (
                        <div>
                          <span className="text-sm font-extrabold font-heading tabular-nums text-primary">
                            {u.points} XP
                          </span>
                          <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {u.tier} Tier
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-body italic">—</span>
                      )}
                    </div>

                    {/* Actions (Delete Dialog) */}
                    <div className="col-span-2 sm:col-span-2 flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            data-testid={`delete-user-${u.user_id}`}
                            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label={`Delete ${u.name}`}
                            title="Delete User"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </motion.button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-border bg-card shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-heading text-lg flex items-center gap-2">
                              <Trash2 className="text-destructive" size={20} strokeWidth={2} />
                              Delete Account for "{u.name}"?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="font-body text-sm text-muted-foreground">
                              This action is irreversible. All course enrollments, study notes, quiz logs, and XP points associated with {u.email} will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="eh-btn-outline rounded-xl font-body text-xs h-10 px-4">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(u.user_id, u.name)}
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body text-xs h-10 px-5 font-bold shadow-sm"
                            >
                              Confirm Deletion
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
