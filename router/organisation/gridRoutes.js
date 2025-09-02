// router/organisation/gridRoutes.js
const express = require('express');
const router = express.Router();

const GridController = require('../../controllers/Organisation/GridController');

// PATCH: Update a specific grid cell in a classroom
router.patch('/:organisationId/classroom/:classroomId/grid/:row/:col', GridController.updateGridCell);

module.exports = router;