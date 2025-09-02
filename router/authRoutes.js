// router/authRoutes.js
const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');

// POST: Register a new user
router.post('/register', AuthController.register);

// POST: Login user
router.post('/login', AuthController.login);

module.exports = router;