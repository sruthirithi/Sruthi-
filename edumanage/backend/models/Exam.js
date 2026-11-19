const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    examType: {
      type: String,
      enum: ['Unit Test', 'Internal', 'Mid Term', 'Final', 'Practical', 'Other'],
      default: 'Internal',
    },
    department: { type: String, trim: true, default: 'All' },
    academicYear: { type: String, trim: true, default: 'All' },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    venue: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
