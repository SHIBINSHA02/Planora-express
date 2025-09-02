// router/organisation/organisationRoutes.js
const express = require('express');
const router = express.Router();

const OrganisationController = require('../../controllers/Organisation/OrganisationController');

// GET: Get all organizations
router.get('/list', OrganisationController.getAllOrganisations);

// GET: Get specific organization by ID
router.get('/:organisationId', OrganisationController.getOrganisationById);

// POST: Create new organization
router.post('/create', OrganisationController.createOrganisation);

// PUT: Update organization
router.put('/:organisationId', OrganisationController.updateOrganisation);

// DELETE: Delete organization
router.delete('/:organisationId', OrganisationController.deleteOrganisation);

// GET: Get organization statistics
router.get('/:organisationId/stats', OrganisationController.getOrganisationStats);

module.exports = router;