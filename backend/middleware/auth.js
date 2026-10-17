import jwt from 'jsonwebtoken';
import UserSession from '../models/UserSession.js';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if session still exists in database
    const session = await UserSession.findOne({ session_token: token });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    let expiresAt = session.expires_at;
    if (typeof expiresAt === 'string') {
      expiresAt = new Date(expiresAt);
    }
    if (expiresAt < new Date()) {
      await UserSession.deleteOne({ session_token: token });
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = await User.findOne({ user_id: session.user_id }, { _id: 0 });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const checkPermission = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires ${allowedRoles.join(' or ')} role`
      });
    }

    next();
  };
};
