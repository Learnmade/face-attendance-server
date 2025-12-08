require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Large limit for base64 images

// Database Connection
// Database Connection
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('FATAL ERROR: MONGODB_URI is not defined.');
} else {
    console.log('Connecting to MongoDB Endpoint:', uri.split('@')[1] || 'Localhost/Malformed'); // Log endpoint only for security
}

mongoose.connect(uri || 'mongodb://localhost:27017/face-attendance', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        // On Cloud, we might want to exit if DB fails
        if (process.env.NODE_ENV === 'production') process.exit(1);
    });

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
