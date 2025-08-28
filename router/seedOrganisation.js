// router/seedOrganisation.js
const express = require('express');
const router = express.Router();
const Organisation = require('../models/Organisation');
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

    // Sample organisation and classroom data
    const sampleOrganisations = [
      {
        organisation: {
          organisationId: 'ORG001',
          admin: 'admin1@example.com'
        },
        classrooms: {
          classroomId: '10A',
          assignedTeacher: john.id, // primary teacher
          assignedTeachers: [john.id, emma.id], // multiple teachers
          assignedSubjects: ['Mathematics', 'English'], // must match assigned teachers
          rows: 2,
          columns: 2,
          grid: [
            { teachers: [john.id], subjects: ['Mathematics'] }, // valid for John
            { teachers: [emma.id], subjects: ['English'] }, // valid for Emma
            { teachers: [john.id, emma.id], subjects: ['Mathematics', 'English'] }, // valid for both
            { teachers: [john.id], subjects: ['Physics'] } // also valid for John
          ]
        }
      },
      {
        organisation: {
          organisationId: 'ORG002',
          admin: 'admin2@example.com'
        },
        classrooms: {
          classroomId: '11A',
          assignedTeacher: michael.id,
          assignedTeachers: [michael.id, john.id],
          assignedSubjects: ['Chemistry', 'Mathematics'],
          rows: 1,
          columns: 2,
          grid: [
            { teachers: [michael.id], subjects: ['Chemistry'] }, // valid for Michael
            { teachers: [john.id], subjects: ['Mathematics'] } // valid for John
          ]
        }
      }
    ];

    // Check for existing organisations with the same classroomId
    const existing = await Organisation.find({
      'classrooms.classroomId': { $in: sampleOrganisations.map(o => o.classrooms.classroomId) }
    });

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Some classrooms already exist",
        existingIds: existing.map(o => o.classrooms.classroomId)
      });
    }

    // Insert organisations
    const inserted = await Organisation.insertMany(sampleOrganisations);

    res.status(201).json({
      message: "Sample classrooms created successfully",
      organisations: inserted
    });

  } catch (error) {
    res.status(500).json({
      message: "Error seeding classroom data",
      error: error.message
    });
  }
});

module.exports = router;