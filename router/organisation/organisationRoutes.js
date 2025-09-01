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
      periodCount: 8, // Default or from schema
      totalDays: 5,   // Default or from schema
      scheduleRows: org.classrooms?.rows || 7,
      scheduleColumns: org.classrooms?.columns || 8,
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
      periodCount: 8, // Default or from schema
      totalDays: 5,   // Default or from schema
      scheduleRows: organisation.classrooms?.rows || 7,
      scheduleColumns: organisation.classrooms?.columns || 8,
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
    const { name, admin, periodCount, totalDays, scheduleRows, scheduleColumns } = req.body;

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
      classrooms: {
        classroomId: 'default-classroom',
        assignedTeacher: null,
        assignedTeachers: [],
        assignedSubjects: [],
        rows: scheduleRows || 7,
        columns: scheduleColumns || 8,
        grid: Array((scheduleRows || 7) * (scheduleColumns || 8)).fill().map(() => ({
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
      scheduleRows: scheduleRows || 7,
      scheduleColumns: scheduleColumns || 8,
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
        'classrooms.rows': updateData.scheduleRows,
        'classrooms.columns': updateData.scheduleColumns,
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
      periodCount: updateData.periodCount || 8,
      totalDays: updateData.totalDays || 5,
      scheduleRows: organisation.classrooms.rows,
      scheduleColumns: organisation.classrooms.columns,
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
