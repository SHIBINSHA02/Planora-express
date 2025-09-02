// router/organisation/accessRoutes.js
const express = require('express');
const router = express.Router();
const isEmpty = require('is-empty');

const Organisation = require('../../models/Organisation');
const Teacher = require('../../models/Teacher');

// GET: Get all permissions for a teacher in an organisation
router.get('/:organisationId/teachers/:teacherId/permissions', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;
    const teacherIdNum = parseInt(teacherId);

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

    const organizationData = teacher.getOrganizationMembership(organisationId);

    res.status(200).json({
      organisation: organisation.organisation.organisationId,
      teacherId: teacherIdNum,
      permissions: organizationData.permissions,
      globalPermissions: teacher.globalPermissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching permissions', error: error.message });
  }
});

// PUT: Update permissions for a teacher in an organisation
router.put('/:organisationId/teachers/:teacherId/permissions', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;
    const teacherIdNum = parseInt(teacherId);
    const { permissions } = req.body;

    // Validate input
    if (isEmpty(permissions)) {
      return res.status(400).json({ message: 'Permissions object is required' });
    }

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

    // Update organization-specific permissions
    await teacher.updateOrganizationData(organisationId, { permissions });
    await teacher.save();

    const organizationData = teacher.getOrganizationMembership(organisationId);

    res.status(200).json({
      message: 'Permissions updated successfully',
      organisation: organisation.organisation.organisationId,
      teacherId: teacherIdNum,
      permissions: organizationData.permissions
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating permissions', error: error.message });
  }
});

// PATCH: Update specific permission for a teacher in an organisation
router.patch('/:organisationId/teachers/:teacherId/permissions/:permissionType', async (req, res) => {
  try {
    const { organisationId, teacherId, permissionType } = req.params;
    const teacherIdNum = parseInt(teacherId);
    const { value } = req.body;

    // Validate input
    if (typeof value !== 'boolean') {
      return res.status(400).json({ message: 'Permission value must be a boolean' });
    }

    const validPermissions = ['view', 'edit', 'delete', 'manageTeachers', 'manageClassrooms'];
    if (!validPermissions.includes(permissionType)) {
      return res.status(400).json({ 
        message: 'Invalid permission type. Valid types: view, edit, delete, manageTeachers, manageClassrooms' 
      });
    }

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

    const organizationData = teacher.getOrganizationMembership(organisationId);
    const currentPermissions = { ...organizationData.permissions };
    currentPermissions[permissionType] = value;

    // Update organization-specific permissions
    await teacher.updateOrganizationData(organisationId, { permissions: currentPermissions });
    await teacher.save();

    res.status(200).json({
      message: `${permissionType} permission updated successfully`,
      organisation: organisation.organisation.organisationId,
      teacherId: teacherIdNum,
      permission: { [permissionType]: value },
      allPermissions: currentPermissions
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating permission', error: error.message });
  }
});

// GET: Get all teachers with specific permission in an organisation
router.get('/:organisationId/teachers/with-permission/:permissionType', async (req, res) => {
  try {
    const { organisationId, permissionType } = req.params;

    const validPermissions = ['view', 'edit', 'delete', 'manageTeachers', 'manageClassrooms'];
    if (!validPermissions.includes(permissionType)) {
      return res.status(400).json({ 
        message: 'Invalid permission type. Valid types: view, edit, delete, manageTeachers, manageClassrooms' 
      });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get all teachers for this organisation
    const teachers = await organisation.getAllTeachers();
    
    // Filter teachers with the specific permission
    const teachersWithPermission = teachers.filter(teacher => {
      const organizationData = teacher.getOrganizationMembership(organisationId);
      return organizationData.permissions[permissionType] === true;
    });

    res.status(200).json({
      organisation: organisation.organisation.organisationId,
      permissionType: permissionType,
      teachers: teachersWithPermission.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        profilePicture: teacher.profilePicture,
        globalPermissions: teacher.globalPermissions,
        isActive: teacher.isActive,
        organizationData: teacher.getOrganizationMembership(organisationId)
      })),
      count: teachersWithPermission.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers with permission', error: error.message });
  }
});

// GET: Get permission summary for an organisation
router.get('/:organisationId/permissions/summary', async (req, res) => {
  try {
    const { organisationId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get all teachers for this organisation
    const teachers = await organisation.getAllTeachers();
    
    const permissionSummary = {
      view: 0,
      edit: 0,
      delete: 0,
      manageTeachers: 0,
      manageClassrooms: 0
    };

    teachers.forEach(teacher => {
      const organizationData = teacher.getOrganizationMembership(organisationId);
      Object.keys(permissionSummary).forEach(permission => {
        if (organizationData.permissions[permission] === true) {
          permissionSummary[permission]++;
        }
      });
    });

    res.status(200).json({
      organisation: organisation.organisation.organisationId,
      totalTeachers: teachers.length,
      permissionSummary: permissionSummary,
      breakdown: {
        view: `${permissionSummary.view}/${teachers.length} teachers`,
        edit: `${permissionSummary.edit}/${teachers.length} teachers`,
        delete: `${permissionSummary.delete}/${teachers.length} teachers`,
        manageTeachers: `${permissionSummary.manageTeachers}/${teachers.length} teachers`,
        manageClassrooms: `${permissionSummary.manageClassrooms}/${teachers.length} teachers`
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching permission summary', error: error.message });
  }
});

// POST: Bulk update permissions for multiple teachers
router.post('/:organisationId/teachers/bulk-permissions', async (req, res) => {
  try {
    const { organisationId } = req.params;
    const { teacherUpdates } = req.body;

    // Validate input
    if (!Array.isArray(teacherUpdates) || teacherUpdates.length === 0) {
      return res.status(400).json({ message: 'teacherUpdates must be a non-empty array' });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    const results = [];
    const errors = [];

    for (const update of teacherUpdates) {
      try {
        const { teacherId, permissions } = update;
        const teacherIdNum = parseInt(teacherId);

        if (!permissions || typeof permissions !== 'object') {
          errors.push({ teacherId: teacherIdNum, error: 'Invalid permissions object' });
          continue;
        }

        // Get teacher
        const teacher = await Teacher.findByTeacherId(teacherIdNum);
        if (!teacher || !teacher.belongsToOrganisation(organisationId)) {
          errors.push({ teacherId: teacherIdNum, error: 'Teacher not found in this organisation' });
          continue;
        }

        // Update organization-specific permissions
        await teacher.updateOrganizationData(organisationId, { permissions });
        await teacher.save();

        results.push({
          teacherId: teacherIdNum,
          name: teacher.name,
          permissions: teacher.getOrganizationMembership(organisationId).permissions
        });
      } catch (error) {
        errors.push({ teacherId: update.teacherId, error: error.message });
      }
    }

    res.status(200).json({
      message: 'Bulk permission update completed',
      organisation: organisation.organisation.organisationId,
      successful: results,
      errors: errors,
      summary: {
        total: teacherUpdates.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Error in bulk permission update', error: error.message });
  }
});

// GET: Check if teacher has specific permission
router.get('/:organisationId/teachers/:teacherId/has-permission/:permissionType', async (req, res) => {
  try {
    const { organisationId, teacherId, permissionType } = req.params;
    const teacherIdNum = parseInt(teacherId);

    const validPermissions = ['view', 'edit', 'delete', 'manageTeachers', 'manageClassrooms'];
    if (!validPermissions.includes(permissionType)) {
      return res.status(400).json({ 
        message: 'Invalid permission type. Valid types: view, edit, delete, manageTeachers, manageClassrooms' 
      });
    }

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

    const organizationData = teacher.getOrganizationMembership(organisationId);
    const hasPermission = organizationData.permissions[permissionType] === true;

    res.status(200).json({
      organisation: organisation.organisation.organisationId,
      teacherId: teacherIdNum,
      teacherName: teacher.name,
      permissionType: permissionType,
      hasPermission: hasPermission,
      allPermissions: organizationData.permissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking permission', error: error.message });
  }
});

module.exports = router;
