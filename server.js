// Main server file for Finlay Brewer International Landing Page
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');
require('dotenv').config();

// Initialize database connection
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Compression middleware (gzip) - should be early in the middleware stack
app.use(compression({
  level: 6, // Balance between compression and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Compress JSON, HTML, CSS, JS, and text responses
    const contentType = res.getHeader('content-type') || '';
    if (contentType.includes('application/json') || 
        contentType.includes('text/html') || 
        contentType.includes('text/css') || 
        contentType.includes('application/javascript') ||
        contentType.includes('text/plain')) {
      return true;
    }
    // Use compression filter function for other types
    return compression.filter(req, res);
  }
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static files with caching headers
const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0', // 1 year in production, no cache in dev
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Cache images for longer
    if (path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache CSS/JS for shorter period (in case of updates)
    if (path.match(/\.(css|js)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }
    // Cache fonts
    if (path.match(/\.(woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));

// Routes
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database schema
    await initDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

