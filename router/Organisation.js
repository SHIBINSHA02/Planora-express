// router/Organisation.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const isEmpty = require('is-empty');

const Organisation = require('../models/Organisation'); // Updated to use Organisation model
const Teacher = require('../models/Teacher'); // Path to Teacher model
const { checkTeachersExist } = require('../controllers/Teacher/teachersController'); // Import the function


// POST: Create a new classroom within an organisation
router.post('/', async (req, res) => {
  try {
    const { organisationId, admin, classroomId, assignedTeacher, assignedTeachers, assignedSubjects, rows, columns, grid } = req.body;

    // Validate input
    if (isEmpty(organisationId) || isEmpty(admin) || isEmpty(classroomId) || isEmpty(assignedTeacher) || isEmpty(assignedTeachers) || isEmpty(assignedSubjects) || isEmpty(rows) || isEmpty(columns) || isEmpty(grid)) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate teacher existence and IDs using the imported function
    const assignedTeacherCheck = await checkTeachersExist(assignedTeacher);
    const assignedTeachersCheck = await checkTeachersExist(assignedTeachers);

    if (!assignedTeacherCheck.success) {
      return res.status(400).json({ message: assignedTeacherCheck.message });
    }
    if (!assignedTeachersCheck.success) {
      return res.status(400).json({ message: assignedTeachersCheck.message });
    }
    
    // Create and save organisation with classroom
    const organisation = new Organisation({
      organisation: {
        organisationId,
        admin
      },
      classrooms: {
        classroomId,
        assignedTeacher,
        assignedTeachers,
        assignedSubjects,
        rows,
        columns,
        grid
      }
    });

    await organisation.save();
    res.status(201).json({ message: 'Classroom created', organisation });
  } catch (error) {
    res.status(400).json({ message: 'Error creating classroom', error: error.message });
  }
});
// GET: Retrieve a classroom by organisationId and classroomId
router.get('/:organisationId/classroom/:classroomId', async (req, res) => {
  try {
    const { organisationId, classroomId } = req.params;
    const organisation = await Organisation.findOne({
        'organisation.organisationId': organisationId,
        'classrooms.classroomId': classroomId
      })
      .populate('classrooms.assignedTeacher')
      .populate('classrooms.assignedTeachers')
      .populate('classrooms.grid.teachers');

    if (!organisation || !organisation.classrooms) {
      return res.status(404).json({ message: 'Classroom or Organisation not found' });
    }

    res.status(200).json(organisation.classrooms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving classroom', error: error.message });
  }
});

router.patch('/:organisationId/classroom/:classroomId/grid/:row/:col', async (req, res) => {
  try {
    const { organisationId, classroomId, row, col } = req.params;
    const { teachers, subjects } = req.body;

    // Validate input
    if (isEmpty(teachers) || !Array.isArray(teachers) || isEmpty(subjects) || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Teachers and subjects must be arrays' });
    }

    const organisation = await Organisation.findOne({
      'organisation.organisationId': organisationId,
      'classrooms.classroomId': classroomId
    });
    if (!organisation || !organisation.classrooms) {
      return res.status(404).json({ message: 'Classroom or Organisation not found' });
    }

    const rowIndex = parseInt(row);
    const colIndex = parseInt(col);
    const {
      rows,
      columns
    } = organisation.classrooms;
    if (
      isNaN(rowIndex) || rowIndex < 0 || rowIndex >= rows ||
      isNaN(colIndex) || colIndex < 0 || colIndex >= columns
    ) {
      return res.status(400).json({ message: 'Invalid row or column index' });
    }

    // Update the specific grid cell
    organisation.classrooms.grid[rowIndex * columns + colIndex] = {
      teachers,
      subjects
    };

    // Validate the updated document
    await organisation.validate();

    // Save the updated organisation
    await organisation.save();
    res.status(200).json({ message: 'Grid cell updated', classrooms: organisation.classrooms });
  } catch (error) {
    res.status(400).json({ message: 'Error updating grid cell', error: error.message });
  }
});

// PUT: Update an entire classroom by organisationId and classroomId
router.put('/:organisationId/classroom/:classroomId', async (req, res) => {
  try {
    const { organisationId, classroomId } = req.params;
    const { assignedTeacher, assignedTeachers, assignedSubjects, rows, columns, grid } = req.body;

    // Validate input
    if (isEmpty(assignedTeacher) || isEmpty(assignedTeachers) || isEmpty(assignedSubjects) || isEmpty(rows) || isEmpty(columns) || isEmpty(grid)) {
      return res.status(400).json({ message: 'All fields (assignedTeacher, assignedTeachers, assignedSubjects, rows, columns, grid) are required' });
    }

    // Validate teacher existence and IDs
    const assignedTeacherCheck = await checkTeachersExist(assignedTeacher);
    const assignedTeachersCheck = await checkTeachersExist(assignedTeachers);

    if (!assignedTeacherCheck.success) {
      return res.status(400).json({ message: assignedTeacherCheck.message });
    }
    if (!assignedTeachersCheck.success) {
      return res.status(400).json({ message: assignedTeachersCheck.message });
    }


    // Find and update the organisation with the classroom
    const organisation = await Organisation.findOneAndUpdate({
        'organisation.organisationId': organisationId,
        'classrooms.classroomId': classroomId
      }, {
        $set: {
          'classrooms.assignedTeacher': assignedTeacher,
          'classrooms.assignedTeachers': assignedTeachers,
          'classrooms.assignedSubjects': assignedSubjects,
          'classrooms.rows': rows,
          'classrooms.columns': columns,
          'classrooms.grid': grid,
          'classrooms.updatedAt': new Date()
        }
      }, {
        new: true,
        runValidators: true
      })
      .populate('classrooms.assignedTeacher')
      .populate('classrooms.assignedTeachers')
      .populate('classrooms.grid.teachers');

    if (!organisation || !organisation.classrooms) {
      return res.status(404).json({ message: 'Classroom or Organisation not found' });
    }

    res.status(200).json({ message: 'Classroom updated', classrooms: organisation.classrooms });
  } catch (error) {
    res.status(400).json({ message: 'Error updating classroom', error: error.message });
  }
});

module.exports = router;