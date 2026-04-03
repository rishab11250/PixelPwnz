require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { fetchAll } = require('./services/fetcher');
const { startScheduler } = require('./services/scheduler');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/datasets', require('./routes/snapshots'));
app.use('/api', require('./routes/events'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    try {
        console.log('Performing initial data fetch...');
        await fetchAll();
        startScheduler();
    } catch(err) {
        console.error('Error during initial fetch:', err.message);
    }
});
