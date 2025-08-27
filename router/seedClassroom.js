// router/seedClassroom.js
// router/SeedClassroom.js
const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');

// Route to seed sample classroom data
router.post('/seeds', async (req, res) => {
  try {
    // Fetch teachers (so we don’t hardcode wrong IDs/subjects)
    const john = await Teacher.findOne({ id: 1 });
    const emma = await Teacher.findOne({ id: 2 });
    const michael = await Teacher.findOne({ id: 3 });

    if (!john || !emma || !michael) {
      return res.status(400).json({
        message: "Seed teachers must exist before seeding classrooms"
      });
    }

    // Sample classroom data
    const sampleClassrooms = [
      {
        classroomId: '10A',
        assignedTeacher: john.id, // primary teacher
        assignedTeachers: [john.id, emma.id], // multiple teachers
        assignedSubjects: ['Mathematics', 'English'], // must match assigned teachers
        grid: [
          [
            {
              teachers: [john.id],
              subjects: ['Mathematics'] // valid for John
            },
            {
              teachers: [emma.id],
              subjects: ['English'] // valid for Emma
            }
          ],
          [
            {
              teachers: [john.id, emma.id],
              subjects: ['Mathematics', 'English'] // valid for both
            },
            {
              teachers: [john.id],
              subjects: ['Physics'] // also valid for John
            }
          ]
        ]
      },
      {
        classroomId: '11A',
        assignedTeacher: michael.id,
        assignedTeachers: [michael.id, john.id],
        assignedSubjects: ['Chemistry', 'Mathematics'],
        grid: [
          [
            {
              teachers: [michael.id],
              subjects: ['Chemistry'] // valid for Michael
            },
            {
              teachers: [john.id],
              subjects: ['Mathematics'] // valid for John
            }
          ]
        ]
      }
    ];

    // Check for existing classrooms to avoid duplicates
    const existing = await Classroom.find({
      classroomId: { $in: sampleClassrooms.map(c => c.classroomId) }
    });

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Some classrooms already exist",
        existingIds: existing.map(c => c.classroomId)
      });
    }

    // Insert classrooms
    const inserted = await Classroom.insertMany(sampleClassrooms);

    res.status(201).json({
      message: "Sample classrooms created successfully",
      classrooms: inserted
    });

  } catch (error) {
    res.status(500).json({
      message: "Error seeding classroom data",
      error: error.message
    });
  }
});

module.exports = router;
