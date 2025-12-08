const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { appendAttendance, getAttendanceLogs } = require('../services/googleSheets');
const { getFaceDescriptor, matchFace } = require('../services/faceRecognition');

const { authenticateManager } = require('../middleware/auth');

// Export Attendance
router.post('/verify', authenticateManager, (req, res) => {
    // If middleware passes, PIN is valid
    res.json({ success: true });
});

router.get('/export-attendance', authenticateManager, async (req, res) => {
    try {
        const rows = await getAttendanceLogs();
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        // Convert to CSV
        const csvContent = rows.map(e => e.join(",")).join("\n");

        res.header('Content-Type', 'text/csv');
        res.attachment('attendance_report.csv');
        res.send(csvContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Register Employee
router.post('/register', authenticateManager, async (req, res) => {
    try {
        const { name, employeeId, image } = req.body;

        console.log('Processing Face...');
        console.log(`Received Image Size: ${Math.round(image.length / 1024)} KB`);
        // 1. Process Image to get Face Descriptor
        const faceDescriptor = await getFaceDescriptor(image);
        if (!faceDescriptor) {
            console.log('No face detected');
            return res.status(400).json({ error: 'No face detected in image' });
        }
        console.log('Face detected. Saving to DB...');

        // 2. Save Employee
        const newEmployee = new Employee({
            name,
            employeeId,
            faceData: faceDescriptor
        });

        await newEmployee.save();
        console.log('Saved to DB');
        res.status(201).json({ message: 'Employee registered successfully', employee: newEmployee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

// Mark Attendance
router.post('/mark-attendance', async (req, res) => {
    try {
        const { image, type } = req.body; // type: 'CHECK_IN' or 'CHECK_OUT'

        // 1. Process Image to get Face Descriptor
        const inputDescriptor = await getFaceDescriptor(image);
        if (!inputDescriptor) {
            return res.status(400).json({ error: 'No face detected' });
        }

        // 2. Find Match in Database
        // Note: In production, load all descriptors and match in memory or use a specialized vector DB.
        // For this prototype, we iterate mongo records.
        const employees = await Employee.find({});
        let match = null;

        for (const emp of employees) {
            if (matchFace(emp.faceData, inputDescriptor)) {
                match = emp;
                break;
            }
        }

        if (!match) {
            return res.status(404).json({ error: 'Employee not recognized' });
        }

        // 3. Log Attendance
        const newAttendance = new Attendance({
            employeeId: match.employeeId,
            type: type
        });
        await newAttendance.save();

        // 4. Update Google Sheets
        await appendAttendance({
            employeeId: match.employeeId,
            name: match.name,
            type,
            timestamp: new Date()
        });

        res.json({ message: `Success ${type}`, employee: match });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
