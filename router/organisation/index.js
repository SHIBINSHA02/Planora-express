// router/organisation/index.js
const express = require('express');
const router = express.Router();

// Import all organisation-related route modules
const organisationRoutes = require('./organisationRoutes');
const teacherRoutes = require('./teacherRoutes');
const classroomRoutes = require('./classroomRoutes');
const gridRoutes = require('./gridRoutes');
const otpRoutes = require('./otpRoutes');

// Mount the routes
router.use('/', organisationRoutes);
router.use('/', teacherRoutes);
router.use('/', classroomRoutes);
router.use('/', gridRoutes);
router.use('/', otpRoutes);

module.exports = router;
