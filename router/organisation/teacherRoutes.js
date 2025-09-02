// router/organisation/teacherRoutes.js
const express = require('express');
const router = express.Router();
const isEmpty = require('is-empty');

const Organisation = require('../../models/Organisation');
const Teacher = require('../../models/Teacher');

// POST: Register a new teacher within an organisation
router.post('/:organisationId/teachers', async (req, res) => {
  try {
    const { organisationId } = req.params;
    const { 
      id, 
      name, 
      email, 
      phone, 
      bio, 
      profilePicture, 
      subjects, 
      classes, 
      permissions 
    } = req.body;

    // Validate input
    if (isEmpty(id) || isEmpty(name) || isEmpty(email) || isEmpty(subjects) || isEmpty(classes)) {
      return res.status(400).json({ 
        message: 'id, name, email, subjects, and classes are required' 
      });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Use the new static method to add teacher to organisation
    const teacher = await Organisation.addTeacherToOrganisation(organisationId, {
      id,
      name,
      email,
      phone,
      bio,
      profilePicture,
      subjects,
      classes,
      permissions: permissions || {
        view: true,
        edit: false,
        delete: false,
        manageTeachers: false,
        manageClassrooms: false
      }
    });

    res.status(201).json({ 
      message: 'Teacher registered successfully', 
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive
      },
      organisation: organisation.organisation.organisationId 
    });
  } catch (error) {
    res.status(400).json({ message: 'Error registering teacher', error: error.message });
  }
});

// GET: Get all teachers in an organisation
router.get('/:organisationId/teachers', async (req, res) => {
  try {
    const { organisationId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get all teachers for this organisation using the new method
    const teachers = await organisation.getAllTeachers();

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      teachers: teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizationData: teacher.getOrganizationMembership(organisationId)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
});

// GET: Get a specific teacher in an organisation
router.get('/:organisationId/teachers/:teacherId', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;
    const teacherIdNum = parseInt(teacherId);

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get specific teacher for this organisation using the new method
    const teacher = await organisation.getTeacherById(teacherIdNum);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this organisation' });
    }

    const organizationData = teacher.getOrganizationMembership(organisationId);

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizationData: organizationData
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher', error: error.message });
  }
});

// PUT: Update a teacher in an organisation
router.put('/:organisationId/teachers/:teacherId', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;
    const teacherIdNum = parseInt(teacherId);
    const { 
      name, 
      email, 
      phone, 
      bio, 
      profilePicture, 
      subjects, 
      classes, 
      permissions,
      isActive 
    } = req.body;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get teacher
    const teacher = await Teacher.findByTeacherId(teacherIdNum);
    if (!teacher || !teacher.belongsToOrganisation(organisationId)) {
      return res.status(404).json({ message: 'Teacher not found in this organisation' });
    }

    // Update global teacher data if provided
    if (name) teacher.name = name;
    if (email) teacher.email = email;
    if (phone !== undefined) teacher.phone = phone;
    if (bio !== undefined) teacher.bio = bio;
    if (profilePicture !== undefined) teacher.profilePicture = profilePicture;
    if (isActive !== undefined) teacher.isActive = isActive;

    // Update organization-specific data if provided
    if (subjects || classes || permissions) {
      await teacher.updateOrganizationData(organisationId, {
        subjects,
        classes,
        permissions
      });
    }

    await teacher.save();

    const organizationData = teacher.getOrganizationMembership(organisationId);

    res.status(200).json({ 
      message: 'Teacher updated successfully',
      organisation: organisation.organisation.organisationId,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizationData: organizationData
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating teacher', error: error.message });
  }
});

// DELETE: Remove a teacher from an organisation
router.delete('/:organisationId/teachers/:teacherId', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;
    const teacherIdNum = parseInt(teacherId);

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Use the new static method to remove teacher from organisation
    const teacher = await Organisation.removeTeacherFromOrganisation(organisationId, teacherIdNum);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this organisation' });
    }

    res.status(200).json({ 
      message: 'Teacher removed successfully',
      organisation: organisation.organisation.organisationId,
      teacherId: teacherIdNum
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing teacher', error: error.message });
  }
});

// NEW ENDPOINTS FOR ORGANIZATION-SPECIFIC TEACHER OPERATIONS

// GET: Get teachers by subject in an organisation
router.get('/:organisationId/teachers/subject/:subject', async (req, res) => {
  try {
    const { organisationId, subject } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get teachers by subject
    const teachers = await organisation.getTeachersBySubject(subject);

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      subject: subject,
      teachers: teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizationData: teacher.getOrganizationMembership(organisationId)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers by subject', error: error.message });
  }
});

// GET: Get teachers by class in an organisation
router.get('/:organisationId/teachers/class/:className', async (req, res) => {
  try {
    const { organisationId, className } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get teachers by class
    const teachers = await organisation.getTeachersByClass(className);

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      className: className,
      teachers: teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizationData: teacher.getOrganizationMembership(organisationId)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers by class', error: error.message });
  }
});

// GET: Get active teachers in an organisation
router.get('/:organisationId/teachers/active', async (req, res) => {
  try {
    const { organisationId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get active teachers
    const teachers = await organisation.getActiveTeachers();

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      teachers: teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizationData: teacher.getOrganizationMembership(organisationId)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active teachers', error: error.message });
  }
});

// GET: Get teacher count in an organisation
router.get('/:organisationId/teachers/count', async (req, res) => {
  try {
    const { organisationId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get teacher count
    const count = await organisation.getTeacherCount();

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      teacherCount: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher count', error: error.message });
  }
});

module.exports = router;
