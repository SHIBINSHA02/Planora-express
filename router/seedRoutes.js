// router/seedRoutes.js
const express = require('express');
const router = express.Router();

const SeedController = require('../controllers/SeedController');

// GET /seed?force=true
router.get('/seed', SeedController.seed);

module.exports = router;


