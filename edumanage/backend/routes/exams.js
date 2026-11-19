const express = require('express');
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid exam id' });
  }
  next();
}

function pickFields(body) {
  const { subject, examType, department, academicYear, date, startTime, endTime, venue } = body || {};
  return { subject, examType, department: department || 'All', academicYear: academicYear || 'All', date, startTime, endTime, venue };
}

function validate(fields) {
  if (!fields.subject || !fields.date || !fields.startTime || !fields.endTime) {
    return 'Subject, date, start time and end time are required';
  }
  if (fields.endTime <= fields.startTime) return 'End time must be after start time';
  return null;
}

function handleError(err, res, next) {
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
}

// List (all logged-in users). ?q=search  ?when=upcoming|past
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    const q = (req.query.q || '').trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ subject: rx }, { department: rx }, { venue: rx }];
    }
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (req.query.when === 'upcoming') filter.date = { $gte: todayStr };
    if (req.query.when === 'past') filter.date = { $lt: todayStr };

    const exams = await Exam.find(filter).sort({ date: 1, startTime: 1 });
    res.json(exams);
  } catch (err) {
    next(err);
  }
});

// Add (admin only)
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const fields = pickFields(req.body);
    const problem = validate(fields);
    if (problem) return res.status(400).json({ message: problem });
    const exam = await Exam.create(fields);
    res.status(201).json(exam);
  } catch (err) {
    handleError(err, res, next);
  }
});

// Edit (admin only)
router.put('/:id', validId, adminOnly, async (req, res, next) => {
  try {
    const fields = pickFields(req.body);
    const problem = validate(fields);
    if (problem) return res.status(400).json({ message: problem });
    const exam = await Exam.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    handleError(err, res, next);
  }
});

// Delete (admin only)
router.delete('/:id', validId, adminOnly, async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
