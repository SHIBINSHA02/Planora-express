const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const organizationRoutes = require('./organizationRoutes');
const teacherRoutes = require('./teacherRoutes');

// Mount route modules
router.use(authRoutes);
router.use(userRoutes);
router.use(organizationRoutes);
router.use(teacherRoutes);

module.exports = router;