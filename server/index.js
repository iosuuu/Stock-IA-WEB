const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Import
const db = require('./db');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const stockRoutes = require('./routes/stock');
const analyzeRoutes = require('./routes/analyze');
const metricsRoutes = require('./routes/metrics');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/metrics', metricsRoutes);

// Simple Health Check
app.get('/', (req, res) => {
    res.send('TRACE IA Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
