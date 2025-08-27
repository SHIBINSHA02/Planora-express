// router/Classroom.js
// router/Classromm.js
const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom'); // Path to your Classroom model
const Teacher = require('../models/Teacher'); // Path to your Teacher model

// POST: Create a new classroom
router.post('/', async (req, res) => {
  try {
    const { classroomId, assignedTeacher, assignedTeachers, assignedSubjects, grid } = req.body;

    // Validate input
    if (!classroomId || !assignedTeacher || !assignedTeachers || !assignedSubjects || !grid) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create and save classroom
    const classroom = new Classroom({
      classroomId,
      assignedTeacher,
      assignedTeachers,
      assignedSubjects,
      grid
    });

    await classroom.save();
    res.status(201).json({ message: 'Classroom created', classroom });
  } catch (error) {
    res.status(400).json({ message: 'Error creating classroom', error: error.message });
  }
});

// GET: Retrieve a classroom by classroomId
router.get('/:classroomId', async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ classroomId: req.params.classroomId })
      .populate('assignedTeacher')
      .populate('assignedTeachers')
      .populate('grid.$[].teachers');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.status(200).json(classroom);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving classroom', error: error.message });
  }
});

// PATCH: Update a specific cell in the grid
router.patch('/:classroomId/grid/:row/:col', async (req, res) => {
  try {
    const { classroomId, row, col } = req.params;
    const { teachers, subjects } = req.body;

    // Validate input
    if (!teachers || !Array.isArray(teachers) || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Teachers and subjects must be arrays' });
    }

    // Find the classroom
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Validate row and col indices
    const rowIndex = parseInt(row);
    const colIndex = parseInt(col);
    if (
      isNaN(rowIndex) || rowIndex < 0 || rowIndex >= classroom.grid.length ||
      isNaN(colIndex) || colIndex < 0 || colIndex >= classroom.grid[0].length
    ) {
      return res.status(400).json({ message: 'Invalid row or column index' });
    }

    // Update the specific grid cell
    classroom.grid[rowIndex][colIndex] = { teachers, subjects };

    // Validate the updated document
    await classroom.validate();

    // Save the updated classroom
    await classroom.save();
    res.status(200).json({ message: 'Grid cell updated', classroom });
  } catch (error) {
    res.status(400).json({ message: 'Error updating grid cell', error: error.message });
  }
});

// PUT: Update an entire classroom by classroomId
router.put('/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { assignedTeacher, assignedTeachers, assignedSubjects, grid } = req.body;

    // Validate input
    if (!assignedTeacher || !assignedTeachers || !assignedSubjects || !grid) {
      return res.status(400).json({ message: 'All fields (assignedTeacher, assignedTeachers, assignedSubjects, grid) are required' });
    }

    // Find and update the classroom
    const classroom = await Classroom.findOneAndUpdate(
      { classroomId },
      {
        assignedTeacher,
        assignedTeachers,
        assignedSubjects,
        grid,
        updatedAt: new Date() // Ensure updatedAt is refreshed
      },
      {
        new: true, // Return the updated document
        runValidators: true // Enforce schema validations
      }
    ).populate('assignedTeacher')
     .populate('assignedTeachers')
     .populate('grid.$[].teachers');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.status(200).json({ message: 'Classroom updated', classroom });
  } catch (error) {
    res.status(400).json({ message: 'Error updating classroom', error: error.message });
  }
});

module.exports = router;