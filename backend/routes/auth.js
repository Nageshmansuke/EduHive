import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const isProduction = process.env.NODE_ENV === 'production';

// Self-service registration may only ever grant STUDENT or TEACHER.
// ADMIN accounts must be created by an existing admin via
// PATCH /api/admin/users/:user_id/role - never trust a client-supplied role
// beyond this whitelist.
const SELF_REGISTER_ROLES = ['STUDENT', 'TEACHER'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sessionCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge,
  path: '/'
});

const issueSession = async (user, res, status) => {
  const token = jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  // Opportunistically clear out this user's already-expired sessions so the
  // collection doesn't grow unbounded across repeated logins (the TTL index
  // will eventually reap them, but this keeps things tidy immediately).
  await UserSession.deleteMany({ user_id: user.user_id, expires_at: { $lt: new Date() } });

  await UserSession.create({
    user_id: user.user_id,
    session_token: token,
    expires_at: expiresAt
  });

  res.cookie('session_token', token, sessionCookieOptions(SESSION_MAX_AGE_MS));

  const isStudent = user.role === 'STUDENT';
  const userResponse = {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role,
    // Achievement points/tiers are student-only — never expose to teachers/admins.
    points: isStudent ? (user.points || 0) : null,
    tier: isStudent ? (user.tier || 'BRONZE') : null
  };

  return res.status(status).json({ user: userResponse });
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Never trust a client-supplied ADMIN role - see SELF_REGISTER_ROLES above.
    const userRole = SELF_REGISTER_ROLES.includes(role) ? role : 'STUDENT';

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user (model will hash password in pre-save hook).
    // Students start at BRONZE; teachers/admins get no achievement tier.
    const user = new User({
      email,
      name: name.trim(),
      password,
      role: userRole,
      points: 0,
      tier: userRole === 'STUDENT' ? 'BRONZE' : null
    });

    await user.save();

    return issueSession(user, res, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return issueSession(user, res, 200);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const isStudent = req.user.role === 'STUDENT';
    const userResponse = {
      user_id: req.user.user_id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      role: req.user.role,
      points: isStudent ? (req.user.points || 0) : null,
      tier: isStudent ? (req.user.tier || 'BRONZE') : null
    };
    return res.status(200).json(userResponse);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user data' });
  }
});

router.post('/logout', verifyToken, async (req, res) => {
  try {
    const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await UserSession.deleteOne({ session_token: token });
    }

    res.clearCookie('session_token', sessionCookieOptions(0));

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;


