// server.js
const express = require('express');
const connectDB = require('./dbms/db');
const teacherRouter = require('./router/Teacher'); 
const seedTeachers = require('./router/SeedTeacher'); 
const seedClassrooms =require('./router/seedClassroom');
const Classroom  =require('./router/Classroom')
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Mount the teacher router
app.use('/api/teachers', teacherRouter);

// Mount the seed router
app.use('/api/seed', seedTeachers);
app.use('/api/classroom',Classroom)
app.use('/api/seeds',seedClassrooms)

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