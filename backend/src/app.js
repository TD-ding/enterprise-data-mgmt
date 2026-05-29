require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const adminRoutes = require('./routes/admin');

// Initialize database
require('./init-db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend in production
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
