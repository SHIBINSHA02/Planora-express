// router/organisation/classroomRoutes.js
const express = require('express');
const router = express.Router();

const ClassroomController = require('../../controllers/Organisation/ClassroomController');

// POST: Create a new classroom within an organisation
router.post('/', ClassroomController.createClassroom);

// GET: Retrieve a classroom by organisationId and classroomId
router.get('/:organisationId/classroom/:classroomId', ClassroomController.getClassroom);

// PUT: Update an entire classroom by organisationId and classroomId
router.put('/:organisationId/classroom/:classroomId', ClassroomController.updateClassroom);

module.exports = router;