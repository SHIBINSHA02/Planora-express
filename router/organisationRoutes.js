// router/organisationRoutes.js
const express = require('express');
const router = express.Router();

const OrganisationAccessController = require('../controllers/OrganisationAccessController');

// POST: Grant organization access to user
router.post('/users/:userId/organization-access', OrganisationAccessController.grantOrganizationAccess);

// DELETE: Revoke organization access from user
router.delete('/users/:userId/organization-access/:organisationId', OrganisationAccessController.revokeOrganizationAccess);

// GET: Get user's accessible organizations
router.get('/users/:userId/organizations', OrganisationAccessController.getAccessibleOrganizations);

// POST: Check if user has access to organization
router.post('/check-access', OrganisationAccessController.checkAccess);

module.exports = router;