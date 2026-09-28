import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const [scheme, token] = authHeader?.split(' ') || [];

  if (scheme !== 'Bearer' || !token || token.length > 4096) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const adminOnly = async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const currentUser = await User.findById(req.user.id).select('isAdmin').lean();
    if (!currentUser?.isAdmin) {
      return res.status(403).json({ message: 'Admin access has been revoked. Sign in through the regular user login.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Unable to verify admin access' });
  }
};
