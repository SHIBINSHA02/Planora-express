// router/organisation/otpRoutes.js
const express = require('express');
const router = express.Router();
const isEmpty = require('is-empty');

const Organisation = require('../../models/Organisation');
const Teacher = require('../../models/Teacher');

// POST: Generate OTP for teacher organization access
router.post('/:organisationId/otp/generate', async (req, res) => {
  try {
    const { organisationId } = req.params;
    const { teacherId, requestedBy } = req.body;

    // Validate input
    if (isEmpty(teacherId) || isEmpty(requestedBy)) {
      return res.status(400).json({ 
        message: 'teacherId and requestedBy are required' 
      });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 
      'organisation.organisationId': organisationId 
    });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Check if OTP is enabled for this organization
    if (!organisation.otpSettings.enabled) {
      return res.status(400).json({ 
        message: 'OTP access is disabled for this organization' 
      });
    }

    // Find the teacher
    const teacher = await Teacher.findOne({ 
      id: teacherId, 
      organisationId,
      isActive: true 
    });
    if (!teacher) {
      return res.status(404).json({ 
        message: 'Teacher not found or inactive in this organisation' 
      });
    }

    // Check if teacher has edit permissions
    if (!teacher.hasEditAccess()) {
      return res.status(403).json({ 
        message: 'Teacher does not have edit access to this organization' 
      });
    }

    // Generate new OTP
    const otp = teacher.generateAccessOTP();
    await teacher.save();

    // Log OTP generation (for security tracking)
    organisation.otpUsage.push({
      teacherId: teacher._id,
      otpCode: otp,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    await organisation.save();

    res.status(200).json({
      message: 'OTP generated successfully',
      organisationId: organisation.organisation.organisationId,
      teacherId: teacher.id,
      teacherName: teacher.name,
      otpExpiresIn: organisation.otpSettings.expirationMinutes,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error generating OTP', 
      error: error.message 
    });
  }
});

// POST: Validate OTP for organization access
router.post('/:organisationId/otp/validate', async (req, res) => {
  try {
    const { organisationId } = req.params;
    const { teacherId, otp } = req.body;

    // Validate input
    if (isEmpty(teacherId) || isEmpty(otp)) {
      return res.status(400).json({ 
        message: 'teacherId and otp are required' 
      });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 
      'organisation.organisationId': organisationId 
    });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Find the teacher
    const teacher = await Teacher.findOne({ 
      id: teacherId, 
      organisationId,
      isActive: true 
    });
    if (!teacher) {
      return res.status(404).json({ 
        message: 'Teacher not found or inactive in this organisation' 
      });
    }

    // Validate OTP
    const validation = teacher.validateOTP(otp);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: validation.message,
        organisationId: organisation.organisation.organisationId,
        teacherId: teacher.id
      });
    }

    // Mark OTP as used
    teacher.markOTPAsUsed();
    await teacher.save();

    // Update OTP usage log
    const otpUsage = organisation.otpUsage.find(
      usage => usage.teacherId.toString() === teacher._id.toString() && 
               usage.otpCode === otp
    );
    if (otpUsage) {
      otpUsage.usedAt = new Date();
    }
    await organisation.save();

    res.status(200).json({
      message: 'OTP validated successfully',
      organisationId: organisation.organisation.organisationId,
      teacherId: teacher.id,
      teacherName: teacher.name,
      permissions: teacher.permissions,
      validatedAt: new Date().toISOString(),
      accessGranted: true
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error validating OTP', 
      error: error.message 
    });
  }
});

// GET: Get OTP status for a teacher
router.get('/:organisationId/otp/status/:teacherId', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 
      'organisation.organisationId': organisationId 
    });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Find the teacher
    const teacher = await Teacher.findOne({ 
      id: teacherId, 
      organisationId,
      isActive: true 
    });
    if (!teacher) {
      return res.status(404).json({ 
        message: 'Teacher not found or inactive in this organisation' 
      });
    }

    const otpStatus = {
      hasOTP: !!(teacher.accessOTP && teacher.accessOTP.code),
      isUsed: teacher.accessOTP ? teacher.accessOTP.isUsed : false,
      isExpired: teacher.accessOTP ? new Date() > teacher.accessOTP.expiresAt : true,
      expiresAt: teacher.accessOTP ? teacher.accessOTP.expiresAt : null,
      hasEditAccess: teacher.hasEditAccess(),
      permissions: teacher.permissions
    };

    res.status(200).json({
      organisationId: organisation.organisation.organisationId,
      teacherId: teacher.id,
      teacherName: teacher.name,
      otpStatus,
      otpSettings: organisation.otpSettings
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting OTP status', 
      error: error.message 
    });
  }
});

// PUT: Update teacher permissions (admin only)
router.put('/:organisationId/teachers/:teacherId/permissions', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;
    const { permissions, updatedBy } = req.body;

    // Validate input
    if (!permissions || !updatedBy) {
      return res.status(400).json({ 
        message: 'permissions and updatedBy are required' 
      });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 
      'organisation.organisationId': organisationId 
    });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Find the teacher
    const teacher = await Teacher.findOne({ 
      id: teacherId, 
      organisationId 
    });
    if (!teacher) {
      return res.status(404).json({ 
        message: 'Teacher not found in this organisation' 
      });
    }

    // Update permissions
    teacher.permissions = {
      view: permissions.view || false,
      edit: permissions.edit || false,
      delete: permissions.delete || false,
      manageTeachers: permissions.manageTeachers || false,
      manageClassrooms: permissions.manageClassrooms || false
    };

    await teacher.save();

    res.status(200).json({
      message: 'Teacher permissions updated successfully',
      organisationId: organisation.organisation.organisationId,
      teacherId: teacher.id,
      teacherName: teacher.name,
      permissions: teacher.permissions,
      updatedBy,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating teacher permissions', 
      error: error.message 
    });
  }
});

// GET: Get all teachers with their permissions in an organization
router.get('/:organisationId/teachers/permissions', async (req, res) => {
  try {
    const { organisationId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 
      'organisation.organisationId': organisationId 
    });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get all teachers with their permissions
    const teachers = await Teacher.find({ 
      organisationId,
      isActive: true 
    }).select('id name permissions isActive createdAt updatedAt');

    const teachersWithPermissions = teachers.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      permissions: teacher.permissions,
      isActive: teacher.isActive,
      hasEditAccess: teacher.hasEditAccess(),
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt
    }));

    res.status(200).json({
      organisationId: organisation.organisation.organisationId,
      organisationName: organisation.organisation.name,
      teachers: teachersWithPermissions,
      totalTeachers: teachersWithPermissions.length,
      teachersWithEditAccess: teachersWithPermissions.filter(t => t.hasEditAccess).length
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching teachers permissions', 
      error: error.message 
    });
  }
});

// PUT: Update organization OTP settings (admin only)
router.put('/:organisationId/otp/settings', async (req, res) => {
  try {
    const { organisationId } = req.params;
    const { otpSettings, updatedBy } = req.body;

    // Validate input
    if (!otpSettings || !updatedBy) {
      return res.status(400).json({ 
        message: 'otpSettings and updatedBy are required' 
      });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 
      'organisation.organisationId': organisationId 
    });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Update OTP settings
    organisation.otpSettings = {
      enabled: otpSettings.enabled !== undefined ? otpSettings.enabled : organisation.otpSettings.enabled,
      expirationMinutes: otpSettings.expirationMinutes || organisation.otpSettings.expirationMinutes,
      maxAttempts: otpSettings.maxAttempts || organisation.otpSettings.maxAttempts
    };

    await organisation.save();

    res.status(200).json({
      message: 'OTP settings updated successfully',
      organisationId: organisation.organisation.organisationId,
      organisationName: organisation.organisation.name,
      otpSettings: organisation.otpSettings,
      updatedBy,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating OTP settings', 
      error: error.message 
    });
  }
});

module.exports = router;
