// router/Auth.js
const express = require('express');
const router = express.Router();
const Auth = require('../models/Auth');
const Organisation = require('../models/Organisation');
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
    const user = await Auth.findOne({ userId });
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
    const user = await Auth.findOne({ userId });
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
    const user = await Auth.findOne({ userId });
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
    const user = await Auth.findOne({ userId });
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





// NEW ENDPOINTS FOR TEACHER-AUTH INTEGRATION

// POST: Link user to teacher profile
router.post('/users/:userId/link-teacher', async (req, res) => {
  try {
    const { userId } = req.params;
    const { teacherId } = req.body;

    if (isEmpty(teacherId)) {
      return res.status(400).json({ message: 'teacherId is required' });
    }

    // Find user
    const user = await Auth.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find teacher
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if teacher is already linked to another user
    if (teacher.linkedUserId && teacher.linkedUserId !== userId) {
      return res.status(400).json({ message: 'Teacher is already linked to another user' });
    }

    // Link teacher to user
    teacher.linkedUserId = userId;
    await teacher.save();

    res.status(200).json({
      message: 'User linked to teacher successfully',
      userId: userId,
      teacherId: teacherId,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        organizations: teacher.organizations.map(org => ({
          organisationId: org.organisationId,
          subjects: org.subjects,
          classes: org.classes,
          permissions: org.permissions,
          isActive: org.isActive
        }))
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Error linking user to teacher', error: error.message });
  }
});

// GET: Get user's linked teacher profile
router.get('/users/:userId/teacher', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await Auth.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find linked teacher
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ linkedUserId: userId });
    if (!teacher) {
      return res.status(404).json({ message: 'No teacher profile linked to this user' });
    }

    res.status(200).json({
      message: 'Teacher profile retrieved successfully',
      userId: userId,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizations: teacher.organizations.map(org => ({
          organisationId: org.organisationId,
          subjects: org.subjects,
          classes: org.classes,
          permissions: org.permissions,
          isActive: org.isActive,
          joinedAt: org.joinedAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher profile', error: error.message });
  }
});

// DELETE: Unlink user from teacher profile
router.delete('/users/:userId/unlink-teacher', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await Auth.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find linked teacher
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ linkedUserId: userId });
    if (!teacher) {
      return res.status(404).json({ message: 'No teacher profile linked to this user' });
    }

    // Unlink teacher from user
    teacher.linkedUserId = undefined;
    await teacher.save();

    res.status(200).json({
      message: 'User unlinked from teacher successfully',
      userId: userId,
      teacherId: teacher.id
    });
  } catch (error) {
    res.status(400).json({ message: 'Error unlinking user from teacher', error: error.message });
  }
});

// GET: Get user's teacher organizations with access
router.get('/users/:userId/teacher-organizations', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await Auth.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find linked teacher
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ linkedUserId: userId });
    if (!teacher) {
      return res.status(404).json({ message: 'No teacher profile linked to this user' });
    }

    // Get organizations where user has access and teacher is a member
    const accessibleOrganizations = user.getAccessibleOrganizations('view');
    const teacherOrganizations = teacher.organizations.filter(org => 
      accessibleOrganizations.some(accOrg => accOrg.organisationId === org.organisationId)
    );

    res.status(200).json({
      message: 'Teacher organizations retrieved successfully',
      userId: userId,
      teacherId: teacher.id,
      organizations: teacherOrganizations.map(org => ({
        organisationId: org.organisationId,
        subjects: org.subjects,
        classes: org.classes,
        permissions: org.permissions,
        isActive: org.isActive,
        joinedAt: org.joinedAt,
        userAccess: accessibleOrganizations.find(accOrg => 
          accOrg.organisationId === org.organisationId
        )?.permissions
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher organizations', error: error.message });
  }
});

// POST: Create teacher profile for user
router.post('/users/:userId/create-teacher', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      id, 
      name, 
      email, 
      phone, 
      bio, 
      profilePicture, 
      globalPermissions 
    } = req.body;

    // Validate required fields
    if (isEmpty(id) || isEmpty(name) || isEmpty(email)) {
      return res.status(400).json({ 
        message: 'id, name, and email are required' 
      });
    }

    // Find user
    const user = await Auth.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a linked teacher
    const Teacher = require('../models/Teacher');
    const existingTeacher = await Teacher.findOne({ linkedUserId: userId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'User already has a linked teacher profile' });
    }

    // Create new teacher
    const teacher = new Teacher({
      id,
      name,
      email,
      phone,
      bio,
      profilePicture,
      globalPermissions: globalPermissions || { view: true, edit: false },
      isActive: true,
      linkedUserId: userId
    });

    const savedTeacher = await teacher.save();

    res.status(201).json({
      message: 'Teacher profile created and linked successfully',
      userId: userId,
      teacher: {
        id: savedTeacher.id,
        name: savedTeacher.name,
        email: savedTeacher.email,
        phone: savedTeacher.phone,
        bio: savedTeacher.bio,
        profilePicture: savedTeacher.profilePicture,
        globalPermissions: savedTeacher.globalPermissions,
        isActive: savedTeacher.isActive
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating teacher profile', error: error.message });
  }
});

module.exports = router;
