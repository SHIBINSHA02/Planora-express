const express = require('express');
const router = express.Router();
const Auth = require('../models/Auth');

// GET: Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await Auth.find({}).select('-password');
    
    res.status(200).json({
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// GET: Get user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await Auth.findOne({ userId }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// PUT: Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email } = req.body;

    const user = await Auth.findOneAndUpdate(
      { userId },
      { 
        firstName, 
        lastName, 
        email, 
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
});

module.exports = router;