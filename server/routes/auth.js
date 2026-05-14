import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { verifyGoogleToken, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/verify-token', verifyGoogleToken);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Admin Login
router.post('/admin/login', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ googleId: sub });

    if (!user) {
      user = new User({
        googleId: sub,
        email,
        name,
        profilePhoto: picture,
        isAdmin: true
      });
      await user.save();
    } else if (!user.isAdmin || (!user.profilePhoto && picture)) {
      if (!user.isAdmin) user.isAdmin = true;
      if (!user.profilePhoto && picture) user.profilePhoto = picture;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: { id: user._id, email: user.email, name: user.name, profilePhoto: user.profilePhoto, isAdmin: user.isAdmin }
    });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Admin Signup
router.post('/admin/signup', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ googleId: sub });

    if (user) {
      user.isAdmin = true;
      if (!user.profilePhoto && picture) user.profilePhoto = picture;
      await user.save();
    } else {
      user = new User({
        googleId: sub,
        email,
        name,
        profilePhoto: picture,
        isAdmin: true
      });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: { id: user._id, email: user.email, name: user.name, profilePhoto: user.profilePhoto, isAdmin: true }
    });
  } catch (error) {
    res.status(401).json({ error: 'Registration failed' });
  }
});

export default router;
