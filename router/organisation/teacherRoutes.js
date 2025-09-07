// router/organisation/teacherRoutes.js
const express = require('express');
const router = express.Router();

const TeacherController = require('../../controllers/Organisation/TeacherController');

// POST: Register a new teacher within an organisation
router.post('/:organisationId/teachers', TeacherController.registerTeacher);

// GET: Get all teachers in an organisation
router.get('/:organisationId/teachers', TeacherController.getAllTeachers);

// GET: Get a specific teacher in an organisation
router.get('/:organisationId/teachers/:teacherId', TeacherController.getTeacherById);

// PUT: Update a teacher in an organisation
router.put('/:organisationId/teachers/:teacherId', TeacherController.updateTeacher);

// DELETE: Remove a teacher from an organisation
router.delete('/:organisationId/teachers/:teacherId', TeacherController.removeTeacher);

// GET: Get teachers by subject in an organisation
router.get('/:organisationId/teachers/subject/:subject', TeacherController.getTeachersBySubject);

// GET: Get teachers by class in an organisation
router.get('/:organisationId/teachers/class/:className', TeacherController.getTeachersByClass);

// GET: Get active teachers in an organisation
router.get('/:organisationId/teachers/active', TeacherController.getActiveTeachers);

// GET: Get teacher count in an organisation
router.get('/:organisationId/teachers/count', TeacherController.getTeacherCount);

// GET: Get teacher's schedule for a specific organisation
router.get('/:organisationId/teachers/:teacherId/schedule', TeacherController.getTeacherSchedule);

module.exports = router;