import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/PageState';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  Pencil, Eraser, Square, Circle, Minus, Type,
  Undo2, Redo2, Trash2, Save, Users, Plus,
  ChevronDown, X, Check, Eye, PenTool, Copy, CheckCircle,
  Sparkles, Layers, Shield, Download, RefreshCw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const TOOLS = {
  PEN: 'pen',
  ERASER: 'eraser',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  TEXT: 'text'
};

const COLORS = [
  '#0F172A', '#D97706', '#EF4444', '#0D9488', '#F59E0B',
  '#1E293B', '#64748B', '#06B6D4', '#F97316', '#FFFFFF'
];

const STROKE_WIDTHS = [2, 4, 6, 8, 12];

const Whiteboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(false);

  // Canvas state
  const canvasRef = useRef(null);
  const [tool, setTool] = useState(TOOLS.PEN);
  const [color, setColor] = useState('#0F172A');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canDraw, setCanDraw] = useState(false);
  const [actions, setActions] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: '' });
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error

  const currentAction = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const actionIdCounter = useRef(0);
  const actionsRef = useRef([]);
  const autosaveTimerRef = useRef(null);
  const canDrawRef = useRef(false);

  const isCreator = activeSession?.created_by === user?.user_id;

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const drawAction = (ctx, action) => {
    ctx.save();
    ctx.strokeStyle = action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (action.tool) {
      case TOOLS.PEN:
        if (action.points && action.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
          ctx.stroke();
        }
        break;
      case TOOLS.ERASER:
        if (action.points && action.points.length > 1) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
          ctx.stroke();
        }
        break;
      case TOOLS.RECTANGLE:
        ctx.beginPath();
        ctx.strokeRect(action.x, action.y, action.width, action.height);
        break;
      case TOOLS.CIRCLE: {
        const rx = Math.abs(action.width) / 2;
        const ry = Math.abs(action.height) / 2;
        const cx = action.x + action.width / 2;
        const cy = action.y + action.height / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case TOOLS.LINE:
        ctx.beginPath();
        ctx.moveTo(action.x, action.y);
        ctx.lineTo(action.x + action.width, action.y + action.height);
        ctx.stroke();
        break;
      case TOOLS.TEXT:
        ctx.font = `${action.fontSize || 18}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(action.text, action.x, action.y);
        break;
      default:
        break;
    }
    ctx.restore();
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White background for whiteboard export & eraser destination-out
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const action of actions) {
      try {
        drawAction(ctx, action);
      } catch (error) {
        console.error('Error drawing action:', error, action);
      }
    }
  }, [actions]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    canDrawRef.current = canDraw;
  }, [canDraw]);

  const persistActions = useCallback(async (sessionId, actionsToSave) => {
    if (!sessionId || !canDrawRef.current) return;
    setSaveStatus('saving');
    try {
      await axios.put(
        `${API_URL}/api/whiteboard/${sessionId}/actions`,
        { actions: actionsToSave },
        { withCredentials: true }
      );
      setSaveStatus('saved');
    } catch (error) {
      console.error('Whiteboard autosave error:', error);
      setSaveStatus('error');
    }
  }, []);

  const scheduleAutosave = useCallback((sessionId, nextActions) => {
    if (!sessionId || !canDrawRef.current) return;
    if (Array.isArray(nextActions)) {
      actionsRef.current = nextActions;
    }
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      persistActions(sessionId, actionsRef.current);
    }, 1500);
  }, [persistActions]);

  const flushAutosave = useCallback(async (sessionId) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (sessionId && canDrawRef.current) {
      await persistActions(sessionId, actionsRef.current);
    }
  }, [persistActions]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whiteboard`, { withCredentials: true });
      setSessions(res.data);
    } catch (error) {
      console.error('Fetch sessions error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Socket events for whiteboard
  useEffect(() => {
    if (!socket || !activeSession) return;

    socket.emit('wb_join', {
      session_id: activeSession.session_id,
      user_id: user?.user_id,
      user_name: user?.name
    });

    const handleStateSync = ({ actions: syncActions = [], can_draw: serverCanDraw }) => {
      setActions(syncActions);
      setRedoStack([]);
      if (typeof serverCanDraw === 'boolean') {
        setCanDraw(serverCanDraw);
      }
      setSaveStatus(syncActions.length ? 'saved' : 'idle');
    };

    const handleDraw = ({ action }) => {
      if (!action || !action.id) return;
      setActions(prev => {
        if (prev.find(a => a.id === action.id)) return prev;
        return [...prev, action];
      });
    };

    const handleUndo = ({ undone_action_id }) => {
      setActions(prev => prev.filter(a => a.id !== undone_action_id));
    };

    const handleRedo = ({ action }) => {
      if (!action || !action.id) return;
      setActions(prev => {
        if (prev.find(a => a.id === action.id)) return prev;
        return [...prev, action];
      });
    };

    const handleClear = () => {
      setActions([]);
      setRedoStack([]);
    };

    const handleUserJoined = ({ user_id, user_name, participant_count }) => {
      setParticipants(prev => {
        if (prev.find(p => p.user_id === user_id)) return prev;
        return [...prev, { user_id, user_name }];
      });
    };

    const handleUserLeft = () => {};

    const handlePermissionChanged = ({ user_id, can_draw: newPermission }) => {
      if (user_id === user?.user_id) {
        setCanDraw(newPermission);
      }
    };

    const handleWhiteboardClosed = () => {
      setActiveSession(null);
      setActions([]);
      fetchSessions();
    };

    const handleWbError = ({ message }) => {
      console.error('Whiteboard error:', message);
      setActiveSession(null);
    };

    const handleWbSaved = () => {
      setSaveStatus('saved');
    };

    socket.on('wb_state_sync', handleStateSync);
    socket.on('wb_error', handleWbError);
    socket.on('wb_draw', handleDraw);
    socket.on('wb_undo', handleUndo);
    socket.on('wb_redo', handleRedo);
    socket.on('wb_clear', handleClear);
    socket.on('wb_user_joined', handleUserJoined);
    socket.on('wb_user_left', handleUserLeft);
    socket.on('permission_changed', handlePermissionChanged);
    socket.on('whiteboard_closed', handleWhiteboardClosed);
    socket.on('wb_saved', handleWbSaved);

    return () => {
      const sid = activeSession.session_id;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      if (canDrawRef.current && actionsRef.current) {
        axios.put(
          `${API_URL}/api/whiteboard/${sid}/actions`,
          { actions: actionsRef.current },
          { withCredentials: true }
        ).catch(() => {});
      }
      socket.emit('wb_leave', { session_id: sid });
      socket.off('wb_state_sync', handleStateSync);
      socket.off('wb_error', handleWbError);
      socket.off('wb_draw', handleDraw);
      socket.off('wb_undo', handleUndo);
      socket.off('wb_redo', handleRedo);
      socket.off('wb_clear', handleClear);
      socket.off('wb_user_joined', handleUserJoined);
      socket.off('wb_user_left', handleUserLeft);
      socket.off('permission_changed', handlePermissionChanged);
      socket.off('whiteboard_closed', handleWhiteboardClosed);
      socket.off('wb_saved', handleWbSaved);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeSession?.session_id, user?.user_id, user?.name]);

  useEffect(() => {
    if (!activeSession || !user) return;
    if (activeSession.created_by === user.user_id) {
      setCanDraw(true);
      return;
    }
    const me = activeSession.participants?.find(p => p.user_id === user.user_id);
    setCanDraw(me?.can_draw || false);
  }, [activeSession, user]);

  useEffect(() => {
    if (activeSession) {
      redrawCanvas();
    }
  }, [actions, activeSession, redrawCanvas]);

  useEffect(() => {
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      redrawCanvas();
    };

    if (activeSession) {
      setTimeout(initializeCanvas, 50);
      const handleResize = () => initializeCanvas();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [activeSession, redrawCanvas]);

  const getNextActionId = () => {
    actionIdCounter.current += 1;
    return `${user?.user_id}_${Date.now()}_${actionIdCounter.current}`;
  };

  const handlePointerDown = (e) => {
    if (!canDraw || !canvasRef.current) return;
    e.preventDefault();
    const pos = getCanvasCoords(e);

    if (tool === TOOLS.TEXT) {
      setTextInput({ visible: true, x: pos.x, y: pos.y, value: '' });
      return;
    }

    setIsDrawing(true);
    startPos.current = pos;

    if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
      currentAction.current = {
        id: getNextActionId(),
        tool,
        color,
        strokeWidth: tool === TOOLS.ERASER ? strokeWidth * 3 : strokeWidth,
        points: [pos]
      };
    } else {
      currentAction.current = {
        id: getNextActionId(),
        tool,
        color,
        strokeWidth,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !canDraw || !currentAction.current) return;
    e.preventDefault();

    const pos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
      currentAction.current.points.push(pos);

      try {
        ctx.save();
        ctx.strokeStyle = currentAction.current.color;
        ctx.lineWidth = currentAction.current.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === TOOLS.ERASER) {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }

        const pts = currentAction.current.points;
        if (pts.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        }
        ctx.restore();
      } catch (error) {
        console.error('Error drawing on move:', error);
      }
    } else {
      currentAction.current.width = pos.x - startPos.current.x;
      currentAction.current.height = pos.y - startPos.current.y;
      redrawCanvas();

      try {
        drawAction(ctx, currentAction.current);
      } catch (error) {
        console.error('Error drawing shape preview:', error);
      }
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawing || !currentAction.current) {
      setIsDrawing(false);
      return;
    }
    e?.preventDefault();
    setIsDrawing(false);

    const action = { ...currentAction.current };
    currentAction.current = null;

    setActions((prev) => {
      const next = [...prev, action];
      if (activeSession) scheduleAutosave(activeSession.session_id, next);
      return next;
    });
    setRedoStack([]);

    if (socket && activeSession) {
      socket.emit('wb_draw', { session_id: activeSession.session_id, action });
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.value.trim()) {
      setTextInput({ visible: false, x: 0, y: 0, value: '' });
      return;
    }
    const action = {
      id: getNextActionId(),
      tool: TOOLS.TEXT,
      color,
      strokeWidth,
      x: textInput.x,
      y: textInput.y,
      text: textInput.value,
      fontSize: 18
    };
    setActions((prev) => {
      const next = [...prev, action];
      if (activeSession) scheduleAutosave(activeSession.session_id, next);
      return next;
    });
    setRedoStack([]);
    if (socket && activeSession) {
      socket.emit('wb_draw', { session_id: activeSession.session_id, action });
    }
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
  };

  const handleUndo = () => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    setActions((prev) => {
      const next = prev.slice(0, -1);
      if (activeSession) scheduleAutosave(activeSession.session_id, next);
      return next;
    });
    setRedoStack(prev => [...prev, lastAction]);
    if (socket && activeSession) {
      socket.emit('wb_undo', { session_id: activeSession.session_id, undone_action_id: lastAction.id });
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setActions((prev) => {
      const next = [...prev, action];
      if (activeSession) scheduleAutosave(activeSession.session_id, next);
      return next;
    });
    if (socket && activeSession) {
      socket.emit('wb_redo', { session_id: activeSession.session_id, action });
    }
  };

  const handleClear = () => {
    setActions([]);
    actionsRef.current = [];
    setRedoStack([]);
    if (socket && activeSession) {
      socket.emit('wb_clear', { session_id: activeSession.session_id });
    }
    if (activeSession) scheduleAutosave(activeSession.session_id, []);
  };

  const handleSaveSnapshot = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSession) return;
    const imageData = canvas.toDataURL('image/png');
    try {
      await axios.post(`${API_URL}/api/whiteboard/${activeSession.session_id}/snapshot`, {
        image_data: imageData
      }, { withCredentials: true });
      setSnapshotToast(true);
      setTimeout(() => setSnapshotToast(false), 3000);
    } catch (error) {
      console.error('Save snapshot error:', error);
      alert('Failed to save snapshot');
    }
  };

  const handleTogglePermission = async (userId, currentPermission) => {
    try {
      await axios.patch(`${API_URL}/api/whiteboard/${activeSession.session_id}/permission`, {
        user_id: userId,
        can_draw: !currentPermission
      }, { withCredentials: true });
      const res = await axios.get(`${API_URL}/api/whiteboard/${activeSession.session_id}`, { withCredentials: true });
      setActiveSession(res.data);
    } catch (error) {
      console.error('Toggle permission error:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await axios.post(`${API_URL}/api/whiteboard`, { name: newName.trim() }, { withCredentials: true });
      setActiveSession(res.data);
      setShowCreate(false);
      setNewName('');
      fetchSessions();
    } catch (error) {
      console.error('Create session error:', error);
      alert(error.response?.data?.error || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (e, session) => {
    e.stopPropagation();
    if (session.created_by !== user?.user_id && user?.role !== 'ADMIN') return;
    if (!window.confirm(`Delete whiteboard "${session.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/whiteboard/${session.session_id}`, { withCredentials: true });
      setSessions((prev) => prev.filter((s) => s.session_id !== session.session_id));
    } catch (error) {
      console.error('Delete whiteboard error:', error);
      alert(error.response?.data?.error || 'Failed to delete whiteboard');
    }
  };

  const joinSession = (session) => {
    setActiveSession(session);
    setActions([]);
    setRedoStack([]);
  };

  const leaveSession = async () => {
    if (activeSession) {
      await flushAutosave(activeSession.session_id);
    }
    if (socket && activeSession) {
      socket.emit('wb_leave', { session_id: activeSession.session_id });
    }
    setActiveSession(null);
    setActions([]);
    setRedoStack([]);
    setParticipants([]);
    setSaveStatus('idle');
    fetchSessions();
  };

  const copySessionId = () => {
    if (!activeSession) return;
    navigator.clipboard.writeText(activeSession.session_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ===== SESSION LOBBY =====
  if (!activeSession) {
    return (
      <AppLayout title="Whiteboard">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
                <Sparkles size={13} className="text-primary" />
                <span>Real-Time Vector Whiteboard</span>
              </div>
              <h2
                className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground"
                data-testid="whiteboard-title"
              >
                Collaborative Canvas
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-body mt-1 max-w-xl">
                Brainstorm, sketch formulas, and diagram concepts together in real-time with zero latency.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(!showCreate)}
              data-testid="create-whiteboard-button"
              className="eh-btn-primary h-11 px-5 shadow-sm self-start md:self-auto"
            >
              <Plus size={16} strokeWidth={2} />
              <span>New Board</span>
            </motion.button>
          </motion.div>

          {/* Feature Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: PenTool, label: 'Vector Strokes', desc: 'Precision pen & shapes' },
              { icon: Layers, label: 'Live Sync', desc: 'Sub-50ms peer latency' },
              { icon: Shield, label: 'Host Control', desc: 'Manage draw permissions' },
              { icon: Download, label: 'Export HD', desc: 'Save PNG snapshots' }
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="eh-panel p-4 rounded-xl border border-border/70 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground font-heading">{feat.label}</p>
                    <p className="text-[11px] text-muted-foreground font-body truncate">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create Whiteboard Drawer */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.22, ease: easeOut }}
                className="eh-panel p-6 rounded-2xl border-2 border-primary/30 shadow-lg bg-card"
                data-testid="create-whiteboard-form"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                    <PenTool size={16} className="text-primary" />
                    Create New Canvas Board
                  </h3>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="E.g., CS101 Neural Networks Architecture..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                    data-testid="whiteboard-name-input"
                    className="eh-input flex-1 h-11 px-4 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="eh-btn-ghost h-11 px-4 text-sm"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCreateSession}
                      disabled={creating || !newName.trim()}
                      data-testid="submit-whiteboard-button"
                      className="eh-btn-primary h-11 px-5 text-sm font-semibold shadow-sm"
                    >
                      {creating ? 'Creating...' : 'Launch Canvas'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boards List */}
          {loading ? (
            <LoadingState label="Loading collaborative whiteboards..." />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={PenTool}
              title="No whiteboards yet"
              description="Create the first whiteboard to start collaborating in real-time with classmates."
            />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-heading">
                  Available Whiteboards ({sessions.length})
                </h3>
                <button
                  onClick={fetchSessions}
                  className="eh-btn-ghost text-xs text-muted-foreground h-8 px-2 flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </button>
              </div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {sessions.map((session) => (
                  <motion.div
                    key={session.session_id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeOut } }
                    }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.99 }}
                    className="group eh-panel rounded-2xl overflow-hidden cursor-pointer border border-border/80 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col"
                    onClick={() => joinSession(session)}
                    data-testid={`whiteboard-card-${session.session_id}`}
                  >
                    {/* Thumbnail preview */}
                    {session.snapshot_url ? (
                      <div className="relative overflow-hidden border-b border-border bg-slate-50 h-40">
                        <img
                          src={`${API_URL}${session.snapshot_url}`}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md">
                            Snapshot
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-muted/40 via-muted/20 to-primary/5 border-b border-border flex flex-col items-center justify-center relative">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <PenTool size={22} strokeWidth={2} />
                        </div>
                        <p className="text-xs text-muted-foreground font-body">Interactive Canvas</p>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-base text-foreground font-heading group-hover:text-primary transition-colors line-clamp-1">
                            {session.name}
                          </h4>
                          {(session.created_by === user?.user_id || user?.role === 'ADMIN') && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(e, session)}
                              data-testid={`delete-whiteboard-${session.session_id}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                              title="Delete whiteboard"
                            >
                              <Trash2 size={15} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5 mb-3">
                          <span>Created by</span>
                          <span className="font-semibold text-foreground">{session.creator_name || 'Community'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/70 mt-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            session.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {session.is_active && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {session.is_active ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Join Canvas →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ===== ACTIVE WHITEBOARD CANVAS =====
  const toolButtons = [
    { id: TOOLS.PEN, icon: Pencil, label: 'Freehand Pen' },
    { id: TOOLS.ERASER, icon: Eraser, label: 'Eraser' },
    { id: TOOLS.LINE, icon: Minus, label: 'Line' },
    { id: TOOLS.RECTANGLE, icon: Square, label: 'Rectangle' },
    { id: TOOLS.CIRCLE, icon: Circle, label: 'Circle' },
    { id: TOOLS.TEXT, icon: Type, label: 'Text' }
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden select-none">
      {/* Top Floating Glass HUD */}
      <div
        className="bg-card/95 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between z-30 shadow-sm flex-wrap gap-2 text-foreground"
        data-testid="whiteboard-toolbar"
      >
        {/* Left: Session Information & Exit */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={leaveSession}
            data-testid="leave-whiteboard-button"
            className="eh-btn-ghost h-9 px-3 rounded-xl border border-border flex items-center gap-1.5 font-semibold text-xs"
          >
            <X size={15} strokeWidth={2} />
            <span>Leave Canvas</span>
          </motion.button>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-foreground font-heading truncate max-w-[180px] sm:max-w-xs">
              {activeSession.name}
            </h3>
            <button
              onClick={copySessionId}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Copy Session ID"
              data-testid="copy-wb-session-id"
            >
              {copied ? (
                <CheckCircle size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Center: Tools & Stroke Properties */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/80">
          {toolButtons.map(tb => {
            const Icon = tb.icon;
            const isActive = tool === tb.id;
            return (
              <motion.button
                key={tb.id}
                whileTap={canDraw ? { scale: 0.93 } : {}}
                onClick={() => setTool(tb.id)}
                disabled={!canDraw}
                data-testid={`tool-${tb.id}`}
                title={tb.label}
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                } ${!canDraw ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <Icon size={16} strokeWidth={2} />
              </motion.button>
            );
          })}

          <div className="h-5 w-px bg-border mx-1" />

          {/* Color Picker Swatch */}
          <div className="relative">
            <button
              onClick={() => canDraw && setShowColorPicker(!showColorPicker)}
              disabled={!canDraw}
              data-testid="color-picker-button"
              className={`p-1.5 rounded-xl border border-border bg-background flex items-center gap-1.5 ${
                !canDraw ? 'opacity-30' : 'hover:border-primary/50'
              }`}
              title="Stroke Color"
            >
              <div
                className="w-5 h-5 rounded-lg border border-border/60 shadow-inner"
                style={{ backgroundColor: color }}
              />
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: easeOut }}
                  className="absolute top-full mt-2 left-0 eh-panel p-3 rounded-2xl shadow-xl z-50 border border-border bg-card w-48"
                >
                  <p className="text-[11px] font-bold text-muted-foreground mb-2 font-heading uppercase tracking-wider">
                    Palette
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { setColor(c); setShowColorPicker(false); }}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                          color === c ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-border/80'
                        }`}
                        style={{ backgroundColor: c }}
                        data-testid={`color-${c.replace('#', '')}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-0.5 ml-1">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => canDraw && setStrokeWidth(w)}
                disabled={!canDraw}
                data-testid={`stroke-${w}`}
                title={`Stroke: ${w}px`}
                className={`p-1.5 rounded-lg transition-colors ${
                  strokeWidth === w ? 'bg-primary/15 text-primary' : 'hover:bg-background/80 text-muted-foreground'
                } ${!canDraw ? 'opacity-30' : ''}`}
              >
                <div className="w-5 flex items-center justify-center">
                  <div
                    className="rounded-full bg-current transition-all"
                    style={{ width: Math.max(w, 3), height: Math.max(w, 3) }}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Undo / Redo / Clear */}
          <button
            onClick={handleUndo}
            disabled={!canDraw || actions.length === 0}
            data-testid="undo-button"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} strokeWidth={2} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canDraw || redoStack.length === 0}
            data-testid="redo-button"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} strokeWidth={2} />
          </button>
          <button
            onClick={handleClear}
            disabled={!canDraw}
            data-testid="clear-canvas-button"
            className="p-2 rounded-xl text-destructive hover:bg-destructive/10 disabled:opacity-30"
            title="Clear Canvas"
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Right: Status, Snapshot & Presence */}
        <div className="flex items-center gap-2">
          {!canDraw && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold border border-border">
              <Eye size={13} strokeWidth={2} />
              <span>Spectator Mode</span>
            </span>
          )}

          {canDraw && saveStatus !== 'idle' && (
            <div
              className="text-xs font-medium text-muted-foreground px-2 flex items-center gap-1.5"
              data-testid="whiteboard-save-status"
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw size={11} className="animate-spin text-primary" />
                  <span>Syncing…</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : (
                <span className="text-destructive font-semibold">Sync error</span>
              )}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveSnapshot}
            data-testid="save-snapshot-button"
            className="eh-btn-secondary h-9 px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
            title="Export PNG Snapshot"
          >
            <Save size={14} strokeWidth={2} />
            <span className="hidden sm:inline">Save Snapshot</span>
          </motion.button>

          {isCreator && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowParticipants(!showParticipants)}
              data-testid="participants-button"
              className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                showParticipants
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/60 border-border text-foreground hover:bg-muted'
              }`}
            >
              <Users size={14} strokeWidth={2} />
              <span>Participants ({activeSession.participants?.length || 0})</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Snapshot Saved Toast */}
      <AnimatePresence>
        {snapshotToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2"
          >
            <CheckCircle size={14} />
            <span>Canvas snapshot saved to session archive!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Drawing Canvas Viewport */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          data-testid="whiteboard-canvas"
          className="absolute inset-0 w-full h-full bg-white touch-none"
          style={{
            cursor: !canDraw
              ? 'not-allowed'
              : tool === TOOLS.TEXT
              ? 'text'
              : tool === TOOLS.ERASER
              ? 'cell'
              : 'crosshair'
          }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Text Input Floating Overlay */}
        {textInput.visible && (
          <div
            className="absolute z-20"
            style={{
              left: `${textInput.x}px`,
              top: `${textInput.y}px`,
              transform: 'translate(0, -100%)'
            }}
          >
            <div className="flex items-center gap-1.5 bg-card p-1.5 rounded-xl border border-border shadow-2xl">
              <input
                type="text"
                autoFocus
                value={textInput.value}
                onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                data-testid="text-tool-input"
                className="eh-input bg-background text-foreground border-primary h-9 px-3 text-sm rounded-lg"
                style={{ minWidth: 160 }}
                placeholder="Type note & press enter..."
              />
              <button
                onClick={handleTextSubmit}
                className="eh-btn-primary p-2 h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              >
                <Check size={14} strokeWidth={2} />
              </button>
              <button
                onClick={() => setTextInput({ visible: false, x: 0, y: 0, value: '' })}
                className="eh-btn-ghost p-2 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Floating Participants & Permissions Drawer */}
        <AnimatePresence>
          {showParticipants && isCreator && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="absolute top-4 right-4 eh-panel p-5 w-80 z-20 rounded-2xl shadow-2xl border border-border bg-card/95 backdrop-blur-md"
              data-testid="participants-panel"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <h4 className="font-bold text-sm text-foreground font-heading flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Active Participants ({activeSession.participants?.length || 0})
                </h4>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="eh-divider-list max-h-72 overflow-y-auto space-y-2">
                {activeSession.participants?.map(p => (
                  <div key={p.user_id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                        {p.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground font-body truncate">
                          {p.name} {p.user_id === user?.user_id && '(You)'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body">
                          {p.user_id === activeSession.created_by ? 'Host' : 'Participant'}
                        </p>
                      </div>
                    </div>
                    {p.user_id !== user?.user_id && (
                      <button
                        onClick={() => handleTogglePermission(p.user_id, p.can_draw)}
                        data-testid={`toggle-draw-${p.user_id}`}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all shrink-0 ${
                          p.can_draw
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        }`}
                      >
                        {p.can_draw ? 'Can Draw' : 'View Only'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Whiteboard;
