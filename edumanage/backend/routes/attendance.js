const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function studentFilter(query) {
  const filter = {};
  if (query.department && query.department !== 'All') filter.department = query.department;
  if (query.academicYear && query.academicYear !== 'All') filter.academicYear = query.academicYear;
  return filter;
}

// Department / year options for the filter drop-downs
router.get('/filters', async (req, res, next) => {
  try {
    const [departments, academicYears] = await Promise.all([
      Student.distinct('department'),
      Student.distinct('academicYear'),
    ]);
    res.json({ departments: departments.sort(), academicYears: academicYears.sort() });
  } catch (err) {
    next(err);
  }
});

// Today's present / absent numbers (used by the dashboard)
router.get('/today', async (req, res, next) => {
  try {
    const date = todayStr();
    const [present, absent, total] = await Promise.all([
      Attendance.countDocuments({ date, status: 'present' }),
      Attendance.countDocuments({ date, status: 'absent' }),
      Student.countDocuments(),
    ]);
    res.json({ date, present, absent, notMarked: Math.max(total - present - absent, 0) });
  } catch (err) {
    next(err);
  }
});

// Monthly attendance register
router.get('/register', async (req, res, next) => {
  try {
    const month = MONTH_RE.test(req.query.month || '') ? req.query.month : todayStr().slice(0, 7);
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

    const students = await Student.find(studentFilter(req.query)).sort({ name: 1 });
    const ids = students.map((s) => s._id);
    const records = await Attendance.find({
      student: { $in: ids },
      date: { $regex: `^${month}-` },
    });

    const byStudent = new Map();
    records.forEach((r) => {
      const key = String(r.student);
      if (!byStudent.has(key)) byStudent.set(key, {});
      byStudent.get(key)[Number(r.date.slice(8, 10))] = r.status === 'present' ? 'P' : 'A';
    });

    const rows = students.map((s) => {
      const days = byStudent.get(String(s._id)) || {};
      const values = Object.values(days);
      const present = values.filter((v) => v === 'P').length;
      const absent = values.filter((v) => v === 'A').length;
      const marked = present + absent;
      return {
        _id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        department: s.department,
        academicYear: s.academicYear,
        days,
        present,
        absent,
        percentage: marked ? Math.round((present / marked) * 100) : null,
      };
    });

    res.json({ month, daysInMonth, rows });
  } catch (err) {
    next(err);
  }
});

// Students with their status for one date
router.get('/', async (req, res, next) => {
  try {
    const date = DATE_RE.test(req.query.date || '') ? req.query.date : todayStr();
    const students = await Student.find(studentFilter(req.query)).sort({ name: 1 });
    const records = await Attendance.find({ date, student: { $in: students.map((s) => s._id) } });
    const statusMap = new Map(records.map((r) => [String(r.student), r.status]));

    res.json({
      date,
      students: students.map((s) => ({
        _id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        department: s.department,
        academicYear: s.academicYear,
        dateOfJoining: s.dateOfJoining || null,
        status: statusMap.get(String(s._id)) || null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Save attendance for many students on one date
router.post('/bulk', async (req, res, next) => {
  try {
    const { date, records } = req.body || {};
    if (!DATE_RE.test(date || '')) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required' });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No attendance records to save' });
    }

    const clean = records.filter(
      (r) => r && mongoose.Types.ObjectId.isValid(r.studentId) && ['present', 'absent'].includes(r.status)
    );
    if (clean.length === 0) {
      return res.status(400).json({ message: 'Mark at least one student as present or absent' });
    }

    const ops = clean.map((r) => ({
      updateOne: {
        filter: { student: r.studentId, date },
        update: { $set: { status: r.status, markedBy: req.user._id } },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);

    res.json({ message: `Attendance saved for ${clean.length} student(s)`, saved: clean.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
