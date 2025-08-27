// router/SeedTeacher.js
// models/SeedTeacher.js
const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

// Route to seed sample teacher data
router.post('/seed', async (req, res) => {
  try {
    // Sample teacher data
    const sampleTeachers = [
      {
        id: 1,
        name: 'John Smith',
        subjects: ['Mathematics', 'Physics'],
        classes: ['10A', '11B']
      },
      {
        id: 2,
        name: 'Emma Johnson',
        subjects: ['English', 'Literature'],
        classes: ['9A', '12C']
      },
      {
        id: 3,
        name: 'Michael Brown',
        subjects: ['Chemistry', 'Biology'],
        classes: ['11A', '12A']
      }
    ];

    // Check for existing teachers to avoid duplicates
    const existingTeachers = await Teacher.find({ id: { $in: sampleTeachers.map(t => t.id) } });
    if (existingTeachers.length > 0) {
      return res.status(400).json({ 
        message: 'Some teachers already exist',
        existingIds: existingTeachers.map(t => t.id)
      });
    }

    // Insert sample teachers
    const insertedTeachers = await Teacher.insertMany(sampleTeachers);
    
    res.status(201).json({
      message: 'Sample teachers created successfully',
      teachers: insertedTeachers
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error seeding teacher data', 
      error: error.message 
    });
  }
});

module.exports = router;