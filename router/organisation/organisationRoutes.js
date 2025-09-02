// router/organisation/organisationRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Organisation = require('../../models/Organisation');

// GET: Get all organizations (for the list endpoint)
router.get('/list', async (req, res) => {
  try {
    // Get all organizations
    const organisations = await Organisation.find({});
    
    // Transform the data to match frontend expectations
    const transformedOrgs = organisations.map(org => ({
      id: org.organisation.organisationId,
      name: org.organisation.name,
      admin: org.organisation.admin,
      periodCount: org.periodCount || 8,
      totalDays: org.daysCount || 5,
      scheduleRows: org.daysCount || 5,
      scheduleColumns: org.periodCount || 8,
      createdAt: org.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    }));

    res.status(200).json({ organizations: transformedOrgs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error: error.message });
  }
});

// GET: Get a specific organization by ID
router.get('/:organisationId', async (req, res) => {
  try {
    const { organisationId } = req.params;
    
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Transform the data to match frontend expectations
    const transformedOrg = {
      id: organisation.organisation.organisationId,
      name: organisation.organisation.name,
      admin: organisation.organisation.admin,
      periodCount: organisation.periodCount || 8,
      totalDays: organisation.daysCount || 5,
      scheduleRows: organisation.daysCount || 5,
      scheduleColumns: organisation.periodCount || 8,
      createdAt: organisation.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    };

    res.status(200).json(transformedOrg);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organisation', error: error.message });
  }
});

// POST: Create a new organization (for the create endpoint)
router.post('/create', async (req, res) => {
  try {
    const { name, admin, periodCount, totalDays } = req.body;

    // Validate input
    if (!name || !admin) {
      return res.status(400).json({ message: 'Organization name and admin are required' });
    }

    // Generate a unique organization ID
    const organisationId = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new organization with default classroom structure
    const organisation = new Organisation({
      organisation: {
        organisationId,
        name,
        admin
      },
      periodCount: periodCount || 8,
      daysCount: totalDays || 5,
      classrooms: {
        classroomId: 'default-classroom',
        assignedTeacher: null,
        assignedTeachers: [],
        assignedSubjects: [],
        grid: Array((totalDays || 5) * (periodCount || 8)).fill().map(() => ({
          teachers: [],
          subjects: []
        }))
      }
    });

    await organisation.save();

    // Return the created organization in the format expected by frontend
    const responseOrg = {
      id: organisation.organisation.organisationId,
      name,
      admin,
      periodCount: periodCount || 8,
      totalDays: totalDays || 5,
      scheduleRows: totalDays || 5,
      scheduleColumns: periodCount || 8,
      createdAt: organisation.createdAt.toISOString().split('T')[0]
    };

    res.status(201).json({ 
      message: 'Organization created successfully',
      organization: responseOrg 
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating organization', error: error.message });
  }
});

// PUT: Update an organization
router.put('/:organisationId', async (req, res) => {
  try {
    const { organisationId } = req.params;
    const updateData = req.body;

    const organisation = await Organisation.findOneAndUpdate(
      { 'organisation.organisationId': organisationId },
      { 
        'organisation.name': updateData.name,
        'organisation.admin': updateData.admin,
        periodCount: updateData.periodCount,
        daysCount: updateData.totalDays,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    const responseOrg = {
      id: organisation.organisation.organisationId,
      name: organisation.organisation.name,
      admin: organisation.organisation.admin,
      periodCount: organisation.periodCount || 8,
      totalDays: organisation.daysCount || 5,
      scheduleRows: organisation.daysCount || 5,
      scheduleColumns: organisation.periodCount || 8,
      createdAt: organisation.createdAt.toISOString().split('T')[0]
    };

    res.status(200).json({ 
      message: 'Organization updated successfully',
      organization: responseOrg 
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating organization', error: error.message });
  }
});

// DELETE: Delete an organization
router.delete('/:organisationId', async (req, res) => {
  try {
    const { organisationId } = req.params;

    const organisation = await Organisation.findOneAndDelete({ 
      'organisation.organisationId': organisationId 
    });

    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    res.status(200).json({ 
      message: 'Organization deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting organization', error: error.message });
  }
});

module.exports = router;
