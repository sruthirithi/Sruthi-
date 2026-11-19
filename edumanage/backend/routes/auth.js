const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return { id: user._id, userId: user.userId, name: user.name, email: user.email, role: user.role };
}

// Register a normal user
router.post('/register', async (req, res, next) => {
  try {
    const { userId, name, email, password } = req.body || {};
    if (!userId || !name || !password) {
      return res.status(400).json({ message: 'User ID, name and password are required' });
    }
    if (String(password).length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }
    const id = String(userId).trim().toLowerCase();
    if (await User.findOne({ userId: id })) {
      return res.status(400).json({ message: 'This User ID is already taken' });
    }
    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({ userId: id, name, email: email || '', password: hashed, role: 'user' });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// Login (role = 'admin' or 'user' selects which login tab was used)
router.post('/login', async (req, res, next) => {
  try {
    const { userId, password, role } = req.body || {};
    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }
    const user = await User.findOne({ userId: String(userId).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ message: 'Invalid User ID or password' });
    }
    if (role && user.role !== role) {
      return res.status(403).json({
        message: role === 'admin' ? 'This account is not an admin account' : 'Please use the Admin Login tab for this account',
      });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
