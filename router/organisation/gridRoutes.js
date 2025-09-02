// router/organisation/gridRoutes.js
const express = require('express');
const router = express.Router();
const isEmpty = require('is-empty');

const Organisation = require('../../models/Organisation');

// PATCH: Update a specific grid cell in a classroom
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
      periodCount,
      daysCount
    } = organisation;
    if (
      isNaN(rowIndex) || rowIndex < 0 || rowIndex >= daysCount ||
      isNaN(colIndex) || colIndex < 0 || colIndex >= periodCount
    ) {
      return res.status(400).json({ message: 'Invalid row or column index' });
    }

    // Update the specific grid cell
    organisation.classrooms.grid[rowIndex * periodCount + colIndex] = {
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

module.exports = router;
