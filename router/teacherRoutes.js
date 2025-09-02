// router/teacherRoutes.js
const express = require('express');
const router = express.Router();

const TeacherLinkController = require('../controllers/TeacherLinkController');

// POST: Link user to teacher profile
router.post('/users/:userId/link-teacher', TeacherLinkController.linkUserToTeacher);

// GET: Get user's linked teacher profile
router.get('/users/:userId/teacher', TeacherLinkController.getLinkedTeacher);

// DELETE: Unlink user from teacher profile
router.delete('/users/:userId/unlink-teacher', TeacherLinkController.unlinkUserFromTeacher);

// GET: Get user's teacher organizations with access
router.get('/users/:userId/teacher-organizations', TeacherLinkController.getTeacherOrganizations);

// POST: Create teacher profile for user
router.post('/users/:userId/create-teacher', TeacherLinkController.createTeacherProfile);

// POST: Upsert user and create/link teacher (unified registration)
router.post('/users/create-or-link-teacher', TeacherLinkController.upsertUserAndTeacher);

module.exports = router;