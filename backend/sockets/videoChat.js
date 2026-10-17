import WhiteboardSession from '../models/WhiteboardSession.js';

// session_id -> {
//   status: 'ACTIVE' | 'ENDED',
//   host_user_id, host_socket_id, host_role,
//   participants: Map<socket.id, participant>,
//   ended_at
// }
const videoSessions = new Map();

// session_id -> { actions: [], sockets: Map<socket.id, { user_id, name, can_draw }>, last_activity }
// Module-level (not per-connection!) so it's actually shared across every
// client in a session - previously this Map was declared inside
// `io.on('connection', ...)`, so each socket got its own private, empty
// copy and late joiners never saw anything already drawn.
const whiteboardStates = new Map();
const whiteboardSaveTimers = new Map();
const MAX_WHITEBOARD_ACTIONS = 3000;
const WHITEBOARD_AUTOSAVE_MS = 2000;

const flushWhiteboardToDb = async (sessionId) => {
  const session = whiteboardStates.get(sessionId);
  if (!session) return;
  try {
    await WhiteboardSession.updateOne(
      { session_id: sessionId },
      {
        $set: {
          actions: session.actions,
          actions_updated_at: new Date()
        }
      }
    );
  } catch (error) {
    console.error(`Whiteboard autosave failed for ${sessionId}:`, error.message);
  }
};

const scheduleWhiteboardAutosave = (sessionId) => {
  if (whiteboardSaveTimers.has(sessionId)) {
    clearTimeout(whiteboardSaveTimers.get(sessionId));
  }
  const timer = setTimeout(() => {
    whiteboardSaveTimers.delete(sessionId);
    flushWhiteboardToDb(sessionId);
  }, WHITEBOARD_AUTOSAVE_MS);
  whiteboardSaveTimers.set(sessionId, timer);
};

const cancelWhiteboardAutosave = (sessionId) => {
  if (whiteboardSaveTimers.has(sessionId)) {
    clearTimeout(whiteboardSaveTimers.get(sessionId));
    whiteboardSaveTimers.delete(sessionId);
  }
};

/** Persist immediately (e.g. last user leaves). Optionally sync memory from client save. */
export const persistWhiteboardActions = (sessionId, actions, opts = {}) => {
  if (opts.fromClient && Array.isArray(actions)) {
    const session = whiteboardStates.get(sessionId);
    if (session) {
      session.actions = actions.slice(-MAX_WHITEBOARD_ACTIONS);
      session.last_activity = new Date();
    }
    // Client already wrote to DB via REST; no duplicate write needed.
    return;
  }
  cancelWhiteboardAutosave(sessionId);
  return flushWhiteboardToDb(sessionId);
};

const canManageMeeting = (role) => role === 'TEACHER' || role === 'ADMIN';

const getParticipantList = (session) => Array.from(session.participants.values());

const forceLeaveSocket = (io, targetSocketId, sessionId, reason) => {
  const targetSocket = io.sockets.sockets.get(targetSocketId);
  if (targetSocket) {
    targetSocket.emit('forced_leave', { session_id: sessionId, reason });
    targetSocket.leave(sessionId);
  }
};

const endVideoSession = (io, sessionId, endedBy) => {
  const session = videoSessions.get(sessionId);
  if (!session || session.status === 'ENDED') return;

  session.status = 'ENDED';
  session.ended_at = new Date();

  io.to(sessionId).emit('meeting_ended', {
    session_id: sessionId,
    ended_by: endedBy,
    message: 'The meeting has been ended by the host'
  });

  for (const [sockId] of session.participants.entries()) {
    const sock = io.sockets.sockets.get(sockId);
    if (sock) sock.leave(sessionId);
  }
  session.participants.clear();
  session.host_socket_id = null;
};

const removeVideoParticipant = (io, socket, opts = {}) => {
  for (const [sessionId, session] of videoSessions.entries()) {
    if (!session.participants.has(socket.id)) continue;

    const participant = session.participants.get(socket.id);
    session.participants.delete(socket.id);
    socket.leave(sessionId);

    // If the host leaves without ending, transfer host to another teacher/admin
    // still in the room; otherwise keep session active for remaining students
    // until a teacher ends it (students cannot end).
    if (session.host_socket_id === socket.id) {
      const nextHost = getParticipantList(session).find((p) => canManageMeeting(p.role));
      if (nextHost) {
        session.host_socket_id = nextHost.socket_id;
        session.host_user_id = nextHost.user_id;
        session.host_role = nextHost.role;
        io.to(sessionId).emit('host_changed', {
          host_user_id: nextHost.user_id,
          host_socket_id: nextHost.socket_id
        });
      } else if (opts.endIfHostLeaves) {
        endVideoSession(io, sessionId, { user_id: participant.user_id, user_name: participant.user_name });
        return sessionId;
      } else {
        session.host_socket_id = null;
      }
    }

    if (session.status === 'ACTIVE') {
      io.to(sessionId).emit('participant_left', {
        socket_id: socket.id,
        user_id: participant.user_id,
        participants: getParticipantList(session)
      });
    }

    // Keep ENDED sessions in the map so rejoins are rejected.
    // Active empty sessions without a host can be cleaned later.
    if (session.status === 'ACTIVE' && session.participants.size === 0 && !session.host_socket_id) {
      // Leave a short-lived empty active session only if never hosted — delete.
      videoSessions.delete(sessionId);
    }
    return sessionId;
  }
  return null;
};

const removeWhiteboardParticipant = async (io, socket) => {
  for (const [sessionId, session] of whiteboardStates.entries()) {
    if (session.sockets.has(socket.id)) {
      session.sockets.delete(socket.id);
      session.last_activity = new Date();

      if (session.sockets.size === 0) {
        // Flush strokes before dropping in-memory state so reopen restores them.
        cancelWhiteboardAutosave(sessionId);
        await flushWhiteboardToDb(sessionId);
        whiteboardStates.delete(sessionId);
      } else {
        io.to(`wb_${sessionId}`).emit('wb_user_left', {
          socket_id: socket.id,
          participant_count: session.sockets.size
        });
      }
      break;
    }
  }
};

// Exported so routes/whiteboard.js can push a live permission change into
// any currently-connected sockets for that session without needing a DB
// round trip on every future draw event.
export const updateWhiteboardPermission = (sessionId, userId, canDraw) => {
  const session = whiteboardStates.get(sessionId);
  if (!session) return;
  for (const participant of session.sockets.values()) {
    if (participant.user_id === userId) {
      participant.can_draw = canDraw;
    }
  }
};

export const handleVideoChat = (io) => {
  io.on('connection', (socket) => {
    // `io.use(socketAuthMiddleware)` guarantees socket.user is populated
    // before any connection handler runs - never trust client-sent
    // user_id/user_name for identity, only socket.user.
    const { user_id, name: user_name, role } = socket.user;

    console.log(`Socket connected: ${socket.id} (${user_name})`);

    socket.on('join_video_session', ({ session_id }) => {
      if (!session_id) return;

      let session = videoSessions.get(session_id);

      // Ended meetings cannot be rejoined — a new session_id must be created.
      if (session?.status === 'ENDED') {
        socket.emit('join_rejected', {
          session_id,
          reason: 'This meeting has ended. Create or join a new session.'
        });
        return;
      }

      // Creating a brand-new session is restricted to teachers/admins (hosts).
      if (!session) {
        if (!canManageMeeting(role)) {
          socket.emit('join_rejected', {
            session_id,
            reason: 'No active meeting found with this ID. Wait for a teacher to start one.'
          });
          return;
        }
        session = {
          status: 'ACTIVE',
          host_user_id: user_id,
          host_socket_id: socket.id,
          host_role: role,
          participants: new Map(),
          created_at: new Date(),
          ended_at: null
        };
        videoSessions.set(session_id, session);
      }

      socket.join(session_id);

      session.participants.set(socket.id, {
        socket_id: socket.id,
        user_id,
        user_name,
        role,
        is_host: session.host_user_id === user_id,
        is_audio_on: true,
        is_video_on: true,
        is_sharing_screen: false,
        joined_at: new Date()
      });

      // If host rejoined after disconnect, restore host socket.
      if (session.host_user_id === user_id) {
        session.host_socket_id = socket.id;
      }

      const participants = getParticipantList(session);

      io.to(session_id).emit('participant_joined', {
        socket_id: socket.id,
        user_id,
        user_name,
        participants
      });

      socket.emit('session_joined', {
        session_id,
        participants,
        host_user_id: session.host_user_id,
        status: session.status,
        is_host: session.host_user_id === user_id
      });

      console.log(`User ${user_name} joined session ${session_id}`);
    });

    socket.on('leave_video_session', () => {
      removeVideoParticipant(io, socket);
    });

    // Teacher/Admin host ends the meeting for everyone.
    socket.on('end_video_session', ({ session_id }) => {
      if (!session_id || !canManageMeeting(role)) {
        socket.emit('action_rejected', { reason: 'Only the teacher host can end the meeting' });
        return;
      }
      const session = videoSessions.get(session_id);
      if (!session || session.status !== 'ACTIVE') {
        socket.emit('action_rejected', { reason: 'Meeting is not active' });
        return;
      }
      if (session.host_user_id !== user_id && role !== 'ADMIN') {
        socket.emit('action_rejected', { reason: 'Only the meeting host can end this meeting' });
        return;
      }
      endVideoSession(io, session_id, { user_id, user_name });
      console.log(`Meeting ${session_id} ended by ${user_name}`);
    });

    // Host removes any participant (student or otherwise) from the meeting.
    // Does not end the meeting — other participants stay connected.
    socket.on('remove_participant', ({ session_id, target_socket_id }) => {
      if (!session_id || !target_socket_id || !canManageMeeting(role)) {
        socket.emit('action_rejected', { reason: 'Only the host can remove participants' });
        return;
      }
      const session = videoSessions.get(session_id);
      if (!session || session.status !== 'ACTIVE') return;
      if (session.host_user_id !== user_id && role !== 'ADMIN') {
        socket.emit('action_rejected', { reason: 'Only the meeting host can remove participants' });
        return;
      }
      if (target_socket_id === socket.id) {
        socket.emit('action_rejected', { reason: 'Cannot remove yourself — leave or end the meeting instead' });
        return;
      }

      const target = session.participants.get(target_socket_id);
      if (!target) return;

      session.participants.delete(target_socket_id);
      forceLeaveSocket(io, target_socket_id, session_id, 'removed_by_host');

      io.to(session_id).emit('participant_left', {
        socket_id: target_socket_id,
        user_id: target.user_id,
        participants: getParticipantList(session),
        removed: true
      });

      console.log(`User ${target.user_name} removed from ${session_id} by ${user_name}`);
    });

    // WebRTC signaling relay. Only relayed if the sender has actually
    // joined the session room it claims to be signaling for, preventing a
    // socket from blindly targeting an arbitrary socket id it doesn't share
    // a session with.
    socket.on('send_offer', ({ session_id, target_socket_id, offer }) => {
      if (!session_id || !socket.rooms.has(session_id)) return;
      const session = videoSessions.get(session_id);
      if (!session || session.status !== 'ACTIVE') return;
      io.to(target_socket_id).emit('receive_offer', {
        from_socket_id: socket.id,
        offer
      });
    });

    socket.on('send_answer', ({ session_id, target_socket_id, answer }) => {
      if (!session_id || !socket.rooms.has(session_id)) return;
      const session = videoSessions.get(session_id);
      if (!session || session.status !== 'ACTIVE') return;
      io.to(target_socket_id).emit('receive_answer', {
        from_socket_id: socket.id,
        answer
      });
    });

    socket.on('send_ice_candidate', ({ session_id, target_socket_id, candidate }) => {
      if (!session_id || !socket.rooms.has(session_id)) return;
      const session = videoSessions.get(session_id);
      if (!session || session.status !== 'ACTIVE') return;
      io.to(target_socket_id).emit('receive_ice_candidate', {
        from_socket_id: socket.id,
        candidate
      });
    });

    socket.on('toggle_audio', ({ is_audio_on }) => {
      for (const [sessionId, session] of videoSessions.entries()) {
        if (session.participants.has(socket.id)) {
          session.participants.get(socket.id).is_audio_on = is_audio_on;
          io.to(sessionId).emit('participant_audio_toggled', { socket_id: socket.id, is_audio_on });
          break;
        }
      }
    });

    socket.on('toggle_video', ({ is_video_on }) => {
      for (const [sessionId, session] of videoSessions.entries()) {
        if (session.participants.has(socket.id)) {
          session.participants.get(socket.id).is_video_on = is_video_on;
          io.to(sessionId).emit('participant_video_toggled', { socket_id: socket.id, is_video_on });
          break;
        }
      }
    });

    socket.on('toggle_screen_share', ({ is_sharing_screen }) => {
      for (const [sessionId, session] of videoSessions.entries()) {
        if (session.participants.has(socket.id)) {
          session.participants.get(socket.id).is_sharing_screen = is_sharing_screen;
          io.to(sessionId).emit('participant_screen_share_toggled', { socket_id: socket.id, is_sharing_screen });
          break;
        }
      }
    });

    // ===== POLL ROOMS =====
    socket.on('join_poll_room', ({ poll_id }) => {
      if (!poll_id) return;
      socket.join(`poll_${poll_id}`);
    });

    socket.on('leave_poll_room', ({ poll_id }) => {
      if (!poll_id) return;
      socket.leave(`poll_${poll_id}`);
    });

    // ===== SESSION CHAT EVENTS =====
    socket.on('join_chat_room', ({ session_id }) => {
      if (!session_id) return;
      socket.join(`chat_${session_id}`);
    });

    socket.on('leave_chat_room', ({ session_id }) => {
      if (!session_id) return;
      socket.leave(`chat_${session_id}`);
    });

    // ===== WHITEBOARD EVENTS =====
    socket.on('wb_join', async ({ session_id }) => {
      if (!session_id) return;

      try {
        const dbSession = await WhiteboardSession.findOne({ session_id });
        if (!dbSession || !dbSession.is_active) {
          socket.emit('wb_error', { message: 'This whiteboard session is not available' });
          return;
        }

        const room = `wb_${session_id}`;
        socket.join(room);

        if (!whiteboardStates.has(session_id)) {
          // Restore last saved strokes from DB when the room is cold.
          const savedActions = Array.isArray(dbSession.actions) ? dbSession.actions : [];
          whiteboardStates.set(session_id, {
            actions: savedActions.slice(-MAX_WHITEBOARD_ACTIONS),
            sockets: new Map(),
            created_at: new Date(),
            last_activity: new Date()
          });
        }

        const session = whiteboardStates.get(session_id);

        const isOwner = dbSession.created_by === user_id;
        let participant = dbSession.participants.find((p) => p.user_id === user_id);

        if (!participant) {
          // First time this user has ever joined this board - register them
          // as a persistent (view-only by default) participant so the host
          // can find and grant them draw permission later.
          dbSession.participants.push({ user_id, name: user_name, can_draw: isOwner });
          await dbSession.save();
          participant = dbSession.participants[dbSession.participants.length - 1];
        }

        const canDraw = isOwner || !!participant.can_draw;
        session.sockets.set(socket.id, { user_id, name: user_name, can_draw: canDraw });
        session.last_activity = new Date();

        socket.emit('wb_state_sync', {
          actions: session.actions,
          participant_count: session.sockets.size,
          can_draw: canDraw
        });

        io.to(room).emit('wb_user_joined', {
          user_id,
          user_name,
          socket_id: socket.id,
          participant_count: session.sockets.size
        });

        console.log(`User ${user_name} joined whiteboard ${session_id}`);
      } catch (error) {
        console.error('wb_join error:', error.message);
        socket.emit('wb_error', { message: 'Failed to join whiteboard session' });
      }
    });

    socket.on('wb_leave', async ({ session_id }) => {
      if (!session_id) return;
      socket.leave(`wb_${session_id}`);

      const session = whiteboardStates.get(session_id);
      if (session && session.sockets.has(socket.id)) {
        session.sockets.delete(socket.id);
        session.last_activity = new Date();

        if (session.sockets.size === 0) {
          cancelWhiteboardAutosave(session_id);
          await flushWhiteboardToDb(session_id);
          whiteboardStates.delete(session_id);
        } else {
          io.to(`wb_${session_id}`).emit('wb_user_left', {
            socket_id: socket.id,
            participant_count: session.sockets.size
          });
        }
      }
    });

    // Every mutating whiteboard event is gated on the sender's cached
    // can_draw flag - previously any client could emit wb_draw regardless
    // of the (client-only, easily bypassed) UI permission gate.
    const canCurrentSocketDraw = (session_id) => {
      const session = whiteboardStates.get(session_id);
      return !!session?.sockets.get(socket.id)?.can_draw;
    };

    socket.on('wb_draw', ({ session_id, action }) => {
      if (!session_id || !action || !canCurrentSocketDraw(session_id)) return;

      const session = whiteboardStates.get(session_id);
      session.actions.push(action);
      if (session.actions.length > MAX_WHITEBOARD_ACTIONS) {
        session.actions.splice(0, session.actions.length - MAX_WHITEBOARD_ACTIONS);
      }
      session.last_activity = new Date();
      scheduleWhiteboardAutosave(session_id);

      io.to(`wb_${session_id}`).emit('wb_draw', { action });
    });

    socket.on('wb_undo', ({ session_id, undone_action_id }) => {
      if (!session_id || !canCurrentSocketDraw(session_id)) return;
      const session = whiteboardStates.get(session_id);
      if (session) {
        const idx = session.actions.findIndex((a) => a.id === undone_action_id);
        if (idx !== -1) session.actions.splice(idx, 1);
        session.last_activity = new Date();
        scheduleWhiteboardAutosave(session_id);
      }
      io.to(`wb_${session_id}`).emit('wb_undo', { undone_action_id });
    });

    socket.on('wb_redo', ({ session_id, action }) => {
      if (!session_id || !action || !canCurrentSocketDraw(session_id)) return;
      const session = whiteboardStates.get(session_id);
      if (session) {
        session.actions.push(action);
        session.last_activity = new Date();
        scheduleWhiteboardAutosave(session_id);
      }
      io.to(`wb_${session_id}`).emit('wb_redo', { action });
    });

    socket.on('wb_clear', ({ session_id }) => {
      if (!session_id || !canCurrentSocketDraw(session_id)) return;
      const session = whiteboardStates.get(session_id);
      if (session) {
        session.actions = [];
        session.last_activity = new Date();
        scheduleWhiteboardAutosave(session_id);
      }
      io.to(`wb_${session_id}`).emit('wb_clear', {});
    });

    socket.on('wb_save', async ({ session_id }) => {
      if (!session_id || !canCurrentSocketDraw(session_id)) return;
      const session = whiteboardStates.get(session_id);
      if (!session) return;

      session.last_activity = new Date();
      cancelWhiteboardAutosave(session_id);
      await flushWhiteboardToDb(session_id);

      socket.emit('wb_saved', {
        session_id,
        timestamp: new Date().toISOString(),
        actions_count: session.actions.length
      });
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (${user_name})`);
      removeVideoParticipant(io, socket);
      await removeWhiteboardParticipant(io, socket);
    });
  });
};

// Cleans up whiteboard sessions with no activity for 10+ minutes. Set up
// once at module load - not per-connection - so it doesn't spawn a new
// uncleared interval for every socket that ever connects (that leak also
// meant this Map was previously being recreated per-connection anyway).
setInterval(async () => {
  const now = new Date();
  for (const [sessionId, session] of whiteboardStates.entries()) {
    if (now - session.last_activity > 10 * 60 * 1000) {
      cancelWhiteboardAutosave(sessionId);
      await flushWhiteboardToDb(sessionId);
      whiteboardStates.delete(sessionId);
      console.log(`Whiteboard session ${sessionId} cleaned up (inactive)`);
    }
  }
}, 10 * 60 * 1000);
