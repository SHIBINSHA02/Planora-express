const express = require('express');
const router = express.Router();
const Auth = require('../models/Auth');
const Teacher = require('../models/Teacher');
const isEmpty = require('is-empty');

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