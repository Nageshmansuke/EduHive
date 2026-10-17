import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import UserSession from '../models/UserSession.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Socket.IO connection middleware mirroring middleware/auth.js's verifyToken
 * for REST. Previously every socket event (video join, WebRTC signaling,
 * whiteboard, chat, polls) trusted whatever `user_id`/`user_name` the client
 * chose to send, meaning any user could impersonate anyone else in a live
 * session. This runs once per connection, validates the same session cookie
 * used for REST, and attaches the real user to `socket.user` - all handlers
 * must read identity from there, never from the event payload.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      token = cookies.session_token;
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    jwt.verify(token, JWT_SECRET);

    const session = await UserSession.findOne({ session_token: token });
    if (!session) {
      return next(new Error('Invalid or expired session'));
    }

    const expiresAt = typeof session.expires_at === 'string' ? new Date(session.expires_at) : session.expires_at;
    if (expiresAt < new Date()) {
      return next(new Error('Session expired'));
    }

    const user = await User.findOne({ user_id: session.user_id }, { _id: 0, password: 0 });
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture
    };

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};
