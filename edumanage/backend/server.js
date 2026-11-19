require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const examRoutes = require('./routes/exams');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumanage';
const ADMIN_ID = (process.env.ADMIN_ID || 'sadmin').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sadmin';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET missing in .env - using an insecure default.');
  process.env.JWT_SECRET = 'default_dev_secret';
}

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

async function seedAdmin() {
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.findOneAndUpdate(
    { userId: ADMIN_ID },
    { userId: ADMIN_ID, name: 'Administrator', email: 'admin@edumanage.local', password: hashed, role: 'admin' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin account ready (user id: ${ADMIN_ID})`);
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB connected:', MONGO_URI);
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('\nFailed to start server:', err.message);
    console.error('Make sure MongoDB is running (local service "mongod") or set a valid MONGO_URI in backend/.env');
    process.exit(1);
  }
}

start();
