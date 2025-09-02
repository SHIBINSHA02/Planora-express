const express = require('express');
const router = express.Router();
const Auth = require('../models/Auth');
const isEmpty = require('is-empty');

// POST: Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validate input
    if (isEmpty(username) || isEmpty(email) || isEmpty(password) || isEmpty(firstName) || isEmpty(lastName)) {
      return res.status(400).json({ message: 'Username, email, password, firstName, and lastName are required' });
    }

    // Check if user already exists
    const existingUser = await Auth.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this username or email already exists' });
    }

    // Create new user
    const user = new Auth({
      username,
      email,
      password, // Note: In production, this should be hashed
      firstName,
      lastName,
    });

    const savedUser = await user.save();

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error: error.message });
  }
});

// POST: Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (isEmpty(username) || isEmpty(password)) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await Auth.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password (simple comparison for now)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login on successful login
    await user.updateLastLogin();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
});

module.exports = router;