// router/Teacher.js
const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Organisation = require('../models/Organisation');
const isEmpty = require('is-empty');

// GET all teachers (optional organisationId query parameter for filtering)
router.get('/', async (req, res) => {
  try {
    const { organisationId } = req.query;
    
    let teachers;
    
    if (organisationId) {
      // Get teachers for specific organisation
      const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
      if (!organisation) {
        return res.status(404).json({ message: 'Organisation not found' });
      }
      
      teachers = await Teacher.findTeachersInOrganization(organisationId);
    } else {
      // Get all teachers across all organisations
      teachers = await Teacher.find({ isActive: true });
    }

    res.status(200).json({ 
      organisation: organisationId || 'all',
      teachers 
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
});
// GET teacher by ID (optional organisationId query parameter for organization-specific data)
router.get('/:id', async (req, res) => {
  try {
    const { organisationId } = req.query;
    const teacherId = parseInt(req.params.id);
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    let responseData = {
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
    };

    if (organisationId) {
      // Check if teacher belongs to this organization
      if (!teacher.belongsToOrganisation(organisationId)) {
        return res.status(404).json({ message: 'Teacher not found in this organisation' });
      }
      
      // Get organization-specific data
      const orgMembership = teacher.getOrganizationMembership(organisationId);
      responseData.organisation = organisationId;
      responseData.organizationData = orgMembership;
    }

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher', error: error.message });
  }
});

// CREATE a new teacher (global teacher creation)
router.post('/', async (req, res) => {
  try {
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

    // Check if teacher with given ID already exists globally
    const existingTeacher = await Teacher.findByTeacherId(id);
    if (existingTeacher) {
      return res.status(400).json({ 
        message: 'Teacher with this ID already exists' 
      });
    }

    // Check if email already exists
    const existingEmail = await Teacher.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Teacher with this email already exists' 
      });
    }

    const teacher = new Teacher({
      id,
      name,
      email,
      phone,
      bio,
      profilePicture,
      globalPermissions: globalPermissions || { view: true, edit: false },
      isActive: true
    });

    const savedTeacher = await teacher.save();

    res.status(201).json({ 
      message: 'Teacher created successfully',
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
    res.status(400).json({ message: 'Error creating teacher', error: error.message });
  }
});

// UPDATE teacher by ID (global teacher update)
router.put('/:id', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const { 
      name, 
      email, 
      phone, 
      bio, 
      profilePicture, 
      globalPermissions,
      isActive 
    } = req.body;
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update allowed fields
    if (name) teacher.name = name;
    if (email) teacher.email = email;
    if (phone !== undefined) teacher.phone = phone;
    if (bio !== undefined) teacher.bio = bio;
    if (profilePicture !== undefined) teacher.profilePicture = profilePicture;
    if (globalPermissions) teacher.globalPermissions = globalPermissions;
    if (isActive !== undefined) teacher.isActive = isActive;

    const updatedTeacher = await teacher.save();

    res.status(200).json({ 
      message: 'Teacher updated successfully',
      teacher: {
        id: updatedTeacher.id,
        name: updatedTeacher.name,
        email: updatedTeacher.email,
        phone: updatedTeacher.phone,
        bio: updatedTeacher.bio,
        profilePicture: updatedTeacher.profilePicture,
        globalPermissions: updatedTeacher.globalPermissions,
        isActive: updatedTeacher.isActive
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating teacher', error: error.message });
  }
});

// DELETE teacher by ID (global teacher deletion)
router.delete('/:id', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Remove teacher from all organizations
    for (const org of teacher.organizations) {
      const organisation = await Organisation.findOne({ 'organisation.organisationId': org.organisationId });
      if (organisation) {
        await organisation.removeTeacher(teacher._id);
      }
    }

    // Delete teacher globally
    await Teacher.findByIdAndDelete(teacher._id);

    res.status(200).json({ 
      message: 'Teacher deleted successfully',
      teacherId: teacherId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
});

// NEW ENDPOINTS FOR MULTI-ORGANIZATION SUPPORT

// POST: Add teacher to organization
router.post('/:id/organizations', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const { organisationId, subjects, classes, permissions } = req.body;
    
    if (isEmpty(organisationId) || isEmpty(subjects) || isEmpty(classes)) {
      return res.status(400).json({ 
        message: 'organisationId, subjects, and classes are required' 
      });
    }

    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if organization exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Add teacher to organization
    await teacher.addToOrganization(organisationId, subjects, classes, permissions);
    
    // Add teacher to organisation's teachers array
    await organisation.addTeacher(teacher._id);

    res.status(200).json({ 
      message: 'Teacher added to organization successfully',
      teacherId: teacherId,
      organisationId: organisationId
    });
  } catch (error) {
    res.status(400).json({ message: 'Error adding teacher to organization', error: error.message });
  }
});

// DELETE: Remove teacher from organization
router.delete('/:id/organizations/:organisationId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const { organisationId } = req.params;
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if organization exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Remove teacher from organization
    await teacher.removeFromOrganization(organisationId);
    
    // Remove teacher from organisation's teachers array
    await organisation.removeTeacher(teacher._id);

    res.status(200).json({ 
      message: 'Teacher removed from organization successfully',
      teacherId: teacherId,
      organisationId: organisationId
    });
  } catch (error) {
    res.status(400).json({ message: 'Error removing teacher from organization', error: error.message });
  }
});

// GET: Get teacher's organizations
router.get('/:id/organizations', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const organizations = teacher.organizations.map(org => ({
      organisationId: org.organisationId,
      subjects: org.subjects,
      classes: org.classes,
      permissions: org.permissions,
      isActive: org.isActive,
      joinedAt: org.joinedAt
    }));

    res.status(200).json({ 
      teacherId: teacherId,
      organizations: organizations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher organizations', error: error.message });
  }
});

// PUT: Update teacher's organization data
router.put('/:id/organizations/:organisationId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const { organisationId } = req.params;
    const { subjects, classes, permissions, isActive } = req.body;
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update organization data
    await teacher.updateOrganizationData(organisationId, {
      subjects,
      classes,
      permissions,
      isActive
    });

    res.status(200).json({ 
      message: 'Teacher organization data updated successfully',
      teacherId: teacherId,
      organisationId: organisationId
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating teacher organization data', error: error.message });
  }
});

// GET: Get teacher's schedule for specific organization
router.get('/:id/schedule/:organisationId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const { organisationId } = req.params;
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const schedule = teacher.getScheduleForOrganization(organisationId);
    const scheduleSize = await teacher.getScheduleSize(organisationId);

    res.status(200).json({ 
      teacherId: teacherId,
      organisationId: organisationId,
      schedule: schedule,
      scheduleSize: scheduleSize
    });
  } catch (error) {
    res.status(400).json({ message: 'Error fetching teacher schedule', error: error.message });
  }
});

// PUT: Update teacher's schedule for specific organization
router.put('/:id/schedule/:organisationId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const { organisationId } = req.params;
    const { schedule } = req.body;
    
    if (!schedule) {
      return res.status(400).json({ message: 'Schedule data is required' });
    }
    
    const teacher = await Teacher.findByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update schedule for organization
    await teacher.updateScheduleForOrganization(organisationId, schedule);

    res.status(200).json({ 
      message: 'Teacher schedule updated successfully',
      teacherId: teacherId,
      organisationId: organisationId
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating teacher schedule', error: error.message });
  }
});

module.exports = router;