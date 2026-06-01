const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import database to verify/establish connection on start
const db = require('./config/db');

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'saksham_pravesh_default_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if running on HTTPS
    httpOnly: true, // Prevents XSS script access to session cookie
    maxAge: 1000 * 60 * 60 * 24 // 24 Hours
  }
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- AUTHENTICATION MIDDLEWARES ---

// Check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    // If API request, send 401, otherwise redirect to login page
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthenticated. Please log in.' });
    }
    res.redirect('/login');
  }
};

// Check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
    }
    res.redirect('/student'); // Redirect non-admins to student dashboard
  }
};

// --- VIEW ROUTING (Protected HTML views) ---

// Public page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect(req.session.role === 'admin' ? '/admin' : '/student');
  }
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Register page
app.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect(req.session.role === 'admin' ? '/admin' : '/student');
  }
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Protected Student Dashboard
app.get('/student', isAuthenticated, (req, res) => {
  if (req.session.role === 'admin') {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'views', 'student.html'));
});

// Protected Admin Dashboard
app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// --- API ROUTE MOUNTING ---
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/student', isAuthenticated, studentRoutes);
app.use('/api/admin', isAdmin, adminRoutes);

// Fallback 404 handler for routes not found
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'index.html')); // redirect unknown views back to index
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Saksham Pravesh server running on http://localhost:${PORT}`);
});
