const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    rollNumber: { type: String, trim: true, default: '' },
    department: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    dateOfJoining: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
