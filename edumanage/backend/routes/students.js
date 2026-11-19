const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid student id' });
  }
  next();
}

function pickFields(body) {
  const { name, email, rollNumber, department, academicYear, phone, dateOfJoining } = body || {};
  const fields = { name, email, rollNumber, department, academicYear, phone };
  if (dateOfJoining) fields.dateOfJoining = dateOfJoining;
  return fields;
}

function handleDuplicate(err, res, next) {
  if (err && err.code === 11000) {
    return res.status(400).json({ message: 'A student with this email already exists' });
  }
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
}

// Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [total, departments, years] = await Promise.all([
      Student.countDocuments(),
      Student.distinct('department'),
      Student.distinct('academicYear'),
    ]);
    res.json({ totalStudents: total, departments: departments.length, academicYears: years.length });
  } catch (err) {
    next(err);
  }
});

// List / search
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = q
      ? { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { email: new RegExp(escapeRegex(q), 'i') }] }
      : {};
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validId, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

// Add (admin only)
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const student = await Student.create(pickFields(req.body));
    res.status(201).json(student);
  } catch (err) {
    handleDuplicate(err, res, next);
  }
});

// Edit (admin and user)
router.put('/:id', validId, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, pickFields(req.body), {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    handleDuplicate(err, res, next);
  }
});

// Delete (admin only)
router.delete('/:id', validId, adminOnly, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await Attendance.deleteMany({ student: student._id });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
