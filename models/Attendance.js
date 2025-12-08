const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: String, required: true },
    type: { type: String, enum: ['CHECK_IN', 'CHECK_OUT'], required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
