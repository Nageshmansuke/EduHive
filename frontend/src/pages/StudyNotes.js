import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Upload,
  Globe,
  Lock,
  Share2,
  Paperclip,
  Eye,
  Download,
  ExternalLink,
  Sparkles,
  BookMarked,
  Search,
  CheckCircle2,
  Calendar,
  UserCheck
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

const FILTERS = [
  { id: 'my', label: 'My Notes', icon: Lock, desc: 'Private & personal drafts' },
  { id: 'public', label: 'Community Notes', icon: Globe, desc: 'Shared with everyone' },
  { id: 'shared', label: 'Shared with Me', icon: Share2, desc: 'Peer collaborations' }
];

const StudyNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_public: false });
  const [filter, setFilter] = useState('my');
  const [creating, setCreating] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [viewAttachments, setViewAttachments] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUserId, setShareUserId] = useState('');
  const [shareUserName, setShareUserName] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('VIEW');
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      if (filter === 'my') {
        const res = await axios.get(`${API_URL}/api/notes?user_id=${user?.user_id}`, { withCredentials: true });
        setNotes(res.data);
      } else if (filter === 'public') {
        const res = await axios.get(`${API_URL}/api/notes?public_only=true`, { withCredentials: true });
        setNotes(res.data);
      } else if (filter === 'shared') {
        const res = await axios.get(`${API_URL}/api/notes/shared/with-me`, { withCredentials: true });
        setNotes(res.data.map(item => item.note));
      }
    } catch (error) {
      console.error('Fetch notes error:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, user?.user_id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async () => {
    if (!newNote.title.trim()) return;
    setCreating(true);
    try {
      await axios.post(`${API_URL}/api/notes`, newNote, { withCredentials: true });
      setNewNote({ title: '', content: '', is_public: false });
      setShowCreate(false);
      fetchNotes();
    } catch (error) {
      console.error('Create note error:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (noteId) => {
    if (!editingNote) return;
    try {
      await axios.patch(`${API_URL}/api/notes/${noteId}`, editingNote, { withCredentials: true });
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Update note error:', error);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this study note? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/api/notes/${noteId}`, { withCredentials: true });
      fetchNotes();
    } catch (error) {
      console.error('Delete note error:', error);
    }
  };

  const handleShare = async () => {
    if (!shareUserId.trim() || !shareUserName.trim()) return;
    try {
      await axios.post(
        `${API_URL}/api/notes/${selectedNote}/share`,
        { shared_with: shareUserId, shared_with_name: shareUserName, permission_level: permissionLevel },
        { withCredentials: true }
      );
      setShareUserId('');
      setShareUserName('');
      setPermissionLevel('VIEW');
      setShowShareModal(false);
      setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Share note error:', error);
    }
  };

  const handleFileUpload = async (noteId, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', file.name);

      await axios.post(
        `${API_URL}/api/notes/${noteId}/attachments/upload`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      fetchAttachments(noteId);
    } catch (error) {
      console.error('Upload attachment error:', error);
    }
  };

  const fetchAttachments = async (noteId) => {
    try {
      const res = await axios.get(`${API_URL}/api/notes/${noteId}/attachments`, { withCredentials: true });
      setAttachments(res.data);
      return res.data;
    } catch (error) {
      console.error('Fetch attachments error:', error);
      return [];
    }
  };

  const openNote = async (note) => {
    setViewLoading(true);
    setViewingNote(note);
    setViewAttachments([]);
    try {
      const res = await axios.get(`${API_URL}/api/notes/${note.note_id}`, { withCredentials: true });
      setViewingNote(res.data);
      const atts = await axios.get(`${API_URL}/api/notes/${note.note_id}/attachments`, { withCredentials: true });
      setViewAttachments(atts.data || []);
    } catch (error) {
      console.error('Open note error:', error);
      alert(error.response?.data?.error || 'Unable to open this note');
      setViewingNote(null);
    } finally {
      setViewLoading(false);
    }
  };

  const resolveFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const handleDeleteAttachment = async (noteId, attachmentId) => {
    try {
      await axios.delete(`${API_URL}/api/notes/${noteId}/attachments/${attachmentId}`, { withCredentials: true });
      fetchAttachments(noteId);
    } catch (error) {
      console.error('Delete attachment error:', error);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.user_name?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout title="Study Notes">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
              <BookMarked size={13} className="text-primary" />
              <span>Personal & Collaborative Knowledge</span>
            </div>
            <h2
              className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground"
              data-testid="notes-title"
            >
              Study Notes & Hub
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body mt-1 max-w-xl">
              Write rich markdown notes, share insights with classmates, and attach relevant PDF documents and course files.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(!showCreate)}
            data-testid="create-note-button"
            className="eh-btn-primary h-11 px-5 shadow-sm self-start md:self-auto"
          >
            <Plus size={16} strokeWidth={2} />
            <span>New Note</span>
          </motion.button>
        </motion.div>

        {/* Filter Pills & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const isActive = filter === f.id;
              return (
                <motion.button
                  key={f.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFilter(f.id)}
                  data-testid={`filter-${f.id}`}
                  className={cn(
                    'h-10 px-4 rounded-xl text-xs sm:text-sm font-bold font-body transition-all duration-150 flex items-center gap-2 border shadow-2xs',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon size={14} strokeWidth={2} />
                  <span>{f.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="eh-input pl-9 h-10 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Create Note Drawer */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: easeOut }}
              className="eh-panel p-6 rounded-2xl border-2 border-primary/30 shadow-lg bg-card"
              data-testid="create-note-form"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                  <Edit3 size={16} className="text-primary" />
                  Create New Study Note
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
                placeholder="Note title (e.g., Quick Sort Complexity & Recurrence)..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                data-testid="note-title-input"
                className="eh-input mb-3 h-11 text-sm font-semibold"
                autoFocus
              />
              <textarea
                placeholder="Write your study notes, summary, formulas, or takeaways here..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                data-testid="note-content-input"
                className="eh-input h-48 mb-4 resize-none text-sm p-4 leading-relaxed font-body"
              />

              <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-border">
                <label className="flex items-center gap-3 cursor-pointer select-none" data-testid="note-public-toggle">
                  <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
                    <input
                      type="checkbox"
                      checked={newNote.is_public}
                      onChange={(e) => setNewNote({ ...newNote, is_public: e.target.checked })}
                      className="peer sr-only"
                    />
                    <span className="absolute inset-0 rounded-full bg-muted peer-checked:bg-primary transition-colors duration-150" />
                    <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-xs border border-border transition-transform duration-150 peer-checked:translate-x-4" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground font-body block">Share with Community</span>
                    <span className="text-[11px] text-muted-foreground font-body block">Allow other students on EduHive to discover this note</span>
                  </div>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="eh-btn-ghost h-10 px-4 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreate}
                    disabled={creating || !newNote.title.trim()}
                    data-testid="submit-note-button"
                    className="eh-btn-primary h-10 px-5 text-xs font-bold shadow-sm disabled:opacity-50"
                  >
                    {creating ? 'Saving Note...' : 'Publish Note'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Modal Dialog */}
        <AnimatePresence>
          {showShareModal && selectedNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
              data-testid="share-modal"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: easeOut }}
                onClick={(e) => e.stopPropagation()}
                className="eh-panel shadow-2xl p-6 max-w-md w-full rounded-2xl border border-border bg-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                    <Share2 size={16} className="text-primary" />
                    Share Note with Classmate
                  </h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-4 font-body">
                  Grant direct access to a specific student using their platform User ID or email.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Recipient User ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., usr_91284a10"
                      value={shareUserId}
                      onChange={(e) => setShareUserId(e.target.value)}
                      className="eh-input h-10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Recipient Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Alex Johnson"
                      value={shareUserName}
                      onChange={(e) => setShareUserName(e.target.value)}
                      className="eh-input h-10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Permission Level
                    </label>
                    <select
                      value={permissionLevel}
                      onChange={(e) => setPermissionLevel(e.target.value)}
                      className="eh-input h-10 text-xs"
                    >
                      <option value="VIEW">View Only (Read)</option>
                      <option value="EDIT">Can Edit (Co-author)</option>
                      <option value="COMMENT">Can Comment</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border mt-4">
                    <button
                      onClick={() => setShowShareModal(false)}
                      data-testid="cancel-share-button"
                      className="flex-1 eh-btn-ghost h-10 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleShare}
                      data-testid="submit-share-button"
                      className="flex-1 eh-btn-primary h-10 text-xs font-bold shadow-sm"
                    >
                      Share Note
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Grid */}
        {loading ? (
          <LoadingState label="Loading study notes catalog..." />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery ? 'No matching notes found' : filter === 'my' ? 'No notes in your vault' : 'No notes available'}
            description={
              searchQuery
                ? 'Try a different search keyword.'
                : filter === 'my'
                ? 'Create your first study note to organize insights and track your learning progress.'
                : 'Explore other tabs or create a new public note to share with the community.'
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredNotes.map((note) => {
                const isEditing = editingNote?.note_id === note.note_id;
                const isOwner = note.user_id === user?.user_id;
                return (
                  <motion.div
                    key={note.note_id}
                    variants={cardVariants}
                    className="eh-panel rounded-2xl overflow-hidden border border-border/80 hover:border-primary/40 transition-all duration-200 shadow-sm flex flex-col justify-between"
                    data-testid={`note-card-${note.note_id}`}
                  >
                    <div className="p-5 flex-1 flex flex-col">
                      {isEditing ? (
                        <>
                          <input
                            value={editingNote.title}
                            onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                            className="w-full font-bold text-base text-foreground border-b border-primary/50 mb-3 pb-1.5 bg-transparent focus:outline-none font-heading"
                          />
                          <textarea
                            value={editingNote.content}
                            onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                            className="w-full h-36 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border resize-none focus:outline-none font-body leading-relaxed"
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={() => setEditingNote(null)}
                              className="eh-btn-ghost h-8 px-3 text-xs"
                            >
                              <X size={14} />
                              <span>Cancel</span>
                            </button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleUpdate(note.note_id)}
                              data-testid={`save-note-${note.note_id}`}
                              className="eh-btn-primary h-8 px-3 text-xs font-bold"
                            >
                              <Save size={14} />
                              <span>Save</span>
                            </motion.button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Card Header & Badges */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-foreground font-heading truncate">
                                {note.title}
                              </h3>
                              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                <span className="text-[11px] text-muted-foreground font-body">
                                  by <strong className="text-foreground">{note.user_name || 'Anonymous'}</strong>
                                </span>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                                    note.is_public
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-muted text-muted-foreground border border-border'
                                  )}
                                >
                                  {note.is_public ? (
                                    <>
                                      <Globe size={10} />
                                      <span>Public</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock size={10} />
                                      <span>Private</span>
                                    </>
                                  )}
                                </span>
                                {filter === 'shared' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                    <Share2 size={10} />
                                    <span>Shared</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons Toolbar */}
                            <div className="flex shrink-0 -mr-1">
                              <button
                                onClick={() => openNote(note)}
                                data-testid={`open-note-${note.note_id}`}
                                className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                title="Open & Read Note"
                              >
                                <Eye size={16} strokeWidth={2} />
                              </button>
                              {isOwner && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedNote(note.note_id);
                                      setShowShareModal(true);
                                    }}
                                    data-testid={`share-note-${note.note_id}`}
                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    title="Share Note"
                                  >
                                    <Share2 size={15} strokeWidth={1.75} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      fetchAttachments(note.note_id);
                                      setShowAttachments(showAttachments === note.note_id ? null : note.note_id);
                                    }}
                                    data-testid={`attachments-note-${note.note_id}`}
                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    title="Attachments"
                                  >
                                    <Paperclip size={15} strokeWidth={1.75} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setEditingNote({
                                        note_id: note.note_id,
                                        title: note.title,
                                        content: note.content
                                      })
                                    }
                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    data-testid={`edit-note-${note.note_id}`}
                                    title="Edit Note"
                                  >
                                    <Edit3 size={15} strokeWidth={1.75} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(note.note_id)}
                                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                    data-testid={`delete-note-${note.note_id}`}
                                    title="Delete Note"
                                  >
                                    <Trash2 size={15} strokeWidth={1.75} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Content Snippet */}
                          <div className="flex-1 my-2">
                            {note.content ? (
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4 font-body">
                                {note.content}
                              </p>
                            ) : note.file_type === 'PDF' ? (
                              <p className="text-xs text-muted-foreground font-body italic flex items-center gap-1.5">
                                <FileText size={13} className="text-primary" />
                                <span>PDF Document note — click open to preview</span>
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground font-body italic">
                                Empty study note outline.
                              </p>
                            )}
                          </div>

                          {/* Attachments Collapsible Sub-panel */}
                          <AnimatePresence>
                            {showAttachments === note.note_id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.22, ease: easeOut }}
                                className="mt-3 pt-3 border-t border-border overflow-hidden"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xs font-bold text-foreground font-heading flex items-center gap-1.5">
                                    <Paperclip size={12} className="text-primary" />
                                    Attachments
                                  </h4>
                                  <span className="text-[10px] text-muted-foreground">{attachments.length} files</span>
                                </div>

                                <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                                  {attachments.map((att) => (
                                    <div
                                      key={att.attachment_id}
                                      className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/60 text-xs"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Paperclip size={12} className="text-muted-foreground shrink-0" />
                                        <a
                                          href={resolveFileUrl(att.file_url)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-primary hover:underline truncate font-body font-medium"
                                        >
                                          {att.file_name}
                                        </a>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                          ({(att.file_size / 1024).toFixed(1)} KB)
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteAttachment(note.note_id, att.attachment_id)}
                                        data-testid={`delete-attachment-${att.attachment_id}`}
                                        className="p-1 hover:bg-destructive/10 rounded-md text-destructive shrink-0"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex gap-2">
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={(e) => handleFileUpload(note.note_id, e.target.files?.[0])}
                                    className="hidden"
                                  />
                                  <button
                                    onClick={() => fileInputRef.current?.click()}
                                    data-testid={`upload-attachment-${note.note_id}`}
                                    className="flex-1 eh-btn-primary text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 font-bold"
                                  >
                                    <Upload size={12} />
                                    <span>Upload File</span>
                                  </button>
                                  <button
                                    onClick={() => setShowAttachments(null)}
                                    className="eh-btn-ghost text-xs h-8 px-3 rounded-lg"
                                  >
                                    Done
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between pt-3 border-t border-border/70 mt-3">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-body">
                              <Calendar size={11} />
                              {new Date(note.updated_at).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => openNote(note)}
                              className="text-xs font-bold text-primary hover:underline font-body flex items-center gap-1"
                            >
                              Read Full Note →
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Full Note Viewer Modal Overlay */}
      <AnimatePresence>
        {viewingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setViewingNote(null)}
            data-testid="note-viewer-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="eh-panel shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-border bg-card"
              data-testid="note-viewer"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-border bg-muted/20">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                        viewingNote.is_public
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      )}
                    >
                      {viewingNote.is_public ? 'Public Community Note' : 'Private Note'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-foreground truncate">
                    {viewingNote.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Authored by <strong className="text-foreground">{viewingNote.user_name}</strong> · Updated {new Date(viewingNote.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingNote(null)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="close-note-viewer"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {viewLoading ? (
                  <LoadingState label="Opening note and decrypting attachments..." />
                ) : (
                  <>
                    {viewingNote.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-foreground leading-relaxed font-body text-sm sm:text-base">
                          {viewingNote.content}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground font-body italic">
                        No text body in this note. Check attachments below.
                      </p>
                    )}

                    {viewingNote.file_url && (
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                            <FileText size={16} className="text-primary" />
                            Primary Document ({viewingNote.file_type || 'File'})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={resolveFileUrl(viewingNote.file_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="eh-btn-primary text-xs h-9 px-3.5 rounded-xl font-bold flex items-center gap-1.5"
                              data-testid="view-note-pdf"
                            >
                              <ExternalLink size={13} />
                              <span>{viewingNote.file_type === 'PDF' ? 'Open PDF Reader' : 'Open Document'}</span>
                            </a>
                            <a
                              href={resolveFileUrl(viewingNote.file_url)}
                              download
                              className="eh-btn-outline text-xs h-9 px-3.5 rounded-xl font-bold flex items-center gap-1.5"
                              data-testid="download-note-file"
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </a>
                          </div>
                        </div>

                        {viewingNote.file_type === 'PDF' && (
                          <iframe
                            title="Note PDF preview"
                            src={resolveFileUrl(viewingNote.file_url)}
                            className="w-full h-96 rounded-xl border border-border bg-white"
                          />
                        )}
                      </div>
                    )}

                    {viewAttachments.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                          <Paperclip size={15} className="text-primary" />
                          Attached Resources ({viewAttachments.length})
                        </h4>
                        <div className="eh-panel rounded-xl overflow-hidden border border-border">
                          <div className="eh-divider-list">
                            {viewAttachments.map((att) => (
                              <div
                                key={att.attachment_id}
                                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Paperclip size={14} className="text-muted-foreground shrink-0" />
                                  <span className="text-xs font-semibold font-body truncate">
                                    {att.file_name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    ({(att.file_size / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <a
                                    href={resolveFileUrl(att.file_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline font-body"
                                  >
                                    <Eye size={12} /> Open
                                  </a>
                                  <a
                                    href={resolveFileUrl(att.file_url)}
                                    download={att.file_name}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-foreground hover:underline font-body"
                                  >
                                    <Download size={12} /> Download
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default StudyNotes;
