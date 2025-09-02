// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./dbms/db');
const router = require('./router');
const organisationRouter = require('./router/organisation');
const SeedController = require('./controllers/SeedController');
const app = express();
const port = process.env.PORT || 3000;
const morgan = require('morgan')
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
// Mount the main router (includes auth, users, organizations, teachers)
app.use('/api', router);

// Mount the organisation-specific router
app.use('/api/organisation', organisationRouter);

// Explicit seed endpoint to generate minimum 10 docs per model
app.get('/api/seed', SeedController.seed);

// Basic route for health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Sample API route
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Express.js API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server after connecting to the database
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to connect to the database:', err);
  process.exit(1);
});