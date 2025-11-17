// Main server file for Finlay Brewer International Landing Page
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;

