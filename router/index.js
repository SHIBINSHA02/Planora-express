const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const organizationRoutes = require('./organisationRoutes');
const teacherRoutes = require('./teacherRoutes');
const seedRoutes = require('./seedRoutes');

// Mount route modules
router.use(authRoutes);
router.use(userRoutes);
router.use(organizationRoutes);
router.use(teacherRoutes);
router.use(seedRoutes);

module.exports = router;