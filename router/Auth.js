// router/Auth.js
const express = require('express');
const router = express.Router();
const Auth = require('../models/Auth');
const Organisation = require('../models/Organisation');
const isEmpty = require('is-empty');

// POST: Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

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
      role: role || 'viewer'
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
      $or: [{ username }, { email: username }],
      isActive: true
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }



    // Check password (simple comparison for now)
    if (user.password !== password) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

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

// GET: Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await Auth.find({ isActive: true }).select('-password');
    
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
    
    const user = await Auth.findOne({ userId, isActive: true }).select('-password');
    
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
    const { firstName, lastName, email, role, isActive } = req.body;

    const user = await Auth.findOneAndUpdate(
      { userId },
      { 
        firstName, 
        lastName, 
        email, 
        role, 
        isActive,
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

// POST: Grant organization access to user
router.post('/users/:userId/organization-access', async (req, res) => {
  try {
    const { userId } = req.params;
    const { organisationId, permissions, grantedBy } = req.body;

    // Validate input
    if (isEmpty(organisationId) || isEmpty(permissions) || isEmpty(grantedBy)) {
      return res.status(400).json({ message: 'organisationId, permissions, and grantedBy are required' });
    }

    // Check if organization exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Find user
    const user = await Auth.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Grant access
    await user.grantOrganizationAccess(
      organisationId,
      organisation.organisation.name,
      permissions,
      grantedBy
    );

    const updatedUser = await Auth.findOne({ userId }).select('-password');

    res.status(200).json({
      message: 'Organization access granted successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ message: 'Error granting organization access', error: error.message });
  }
});

// DELETE: Revoke organization access from user
router.delete('/users/:userId/organization-access/:organisationId', async (req, res) => {
  try {
    const { userId, organisationId } = req.params;

    // Find user
    const user = await Auth.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Revoke access
    await user.revokeOrganizationAccess(organisationId);

    const updatedUser = await Auth.findOne({ userId }).select('-password');

    res.status(200).json({
      message: 'Organization access revoked successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ message: 'Error revoking organization access', error: error.message });
  }
});

// GET: Get user's accessible organizations
router.get('/users/:userId/organizations', async (req, res) => {
  try {
    const { userId } = req.params;
    const { permission = 'view' } = req.query;

    // Find user
    const user = await Auth.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get accessible organizations
    const accessibleOrganizations = user.getAccessibleOrganizations(permission);

    res.status(200).json({
      message: 'Accessible organizations retrieved successfully',
      organizations: accessibleOrganizations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accessible organizations', error: error.message });
  }
});

// POST: Check if user has access to organization
router.post('/check-access', async (req, res) => {
  try {
    const { userId, organisationId, permission = 'view' } = req.body;

    // Validate input
    if (isEmpty(userId) || isEmpty(organisationId)) {
      return res.status(400).json({ message: 'userId and organisationId are required' });
    }

    // Find user
    const user = await Auth.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access
    const hasAccess = user.hasAccessToOrganization(organisationId, permission);

    res.status(200).json({
      message: 'Access check completed',
      hasAccess,
      userId,
      organisationId,
      permission
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking access', error: error.message });
  }
});

// DELETE: Deactivate user (soft delete)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Auth.findOneAndUpdate(
      { userId },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating user', error: error.message });
  }
});

// POST: Reset user login attempts (admin only)
router.post('/users/:userId/reset-login-attempts', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Auth.findOneAndUpdate(
      { userId },
      { 
        $unset: { loginAttempts: 1 },
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Login attempts reset successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting login attempts', error: error.message });
  }
});

module.exports = router;
