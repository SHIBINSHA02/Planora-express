// router/userRoutes.js
const express = require('express');
const router = express.Router();

const UserController = require('../controllers/UserController');

// GET: Get all users (admin only)
router.get('/users', UserController.getAllUsers);

// GET: Get user by ID
router.get('/users/:userId', UserController.getUserById);

// PUT: Update user
router.put('/users/:userId', UserController.updateUser);

module.exports = router;