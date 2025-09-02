// router/organisation/accessRoutes.js
const express = require('express');
const router = express.Router();

const AccessController = require('../../controllers/Organisation/AccessController');

// GET: Get all permissions for a teacher in an organisation
router.get('/:organisationId/teachers/:teacherId/permissions', AccessController.getTeacherPermissions);

// PUT: Update permissions for a teacher in an organisation
router.put('/:organisationId/teachers/:teacherId/permissions', AccessController.updateTeacherPermissions);

// PATCH: Update specific permission for a teacher in an organisation
router.patch('/:organisationId/teachers/:teacherId/permissions/:permissionType', AccessController.updateSpecificPermission);

// GET: Get all teachers with specific permission in an organisation
router.get('/:organisationId/teachers/with-permission/:permissionType', AccessController.getTeachersWithPermission);

// GET: Get permission summary for an organisation
router.get('/:organisationId/permissions/summary', AccessController.getPermissionSummary);

// POST: Bulk update permissions for multiple teachers
router.post('/:organisationId/teachers/bulk-permissions', AccessController.bulkUpdatePermissions);

// GET: Check if teacher has specific permission
router.get('/:organisationId/teachers/:teacherId/has-permission/:permissionType', AccessController.checkTeacherPermission);

module.exports = router;