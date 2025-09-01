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
    const { id, name, subjects, classes, scheduleRows, scheduleColumns } = req.body;

    // Validate input
    if (isEmpty(id) || isEmpty(name) || isEmpty(subjects) || isEmpty(classes)) {
      return res.status(400).json({ message: 'id, name, subjects, and classes are required' });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Check if teacher with given ID already exists in this organisation
    const existingTeacher = await Teacher.findOne({ id, organisationId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this ID already exists in this organisation' });
    }

    // Create new teacher with default permissions
    const teacher = new Teacher({
      id,
      organisationId,
      name,
      subjects,
      classes,
      scheduleRows: scheduleRows || 7,
      scheduleColumns: scheduleColumns || 8,
      schedule: new Array((scheduleRows || 7) * (scheduleColumns || 8)).fill({ classroom: null, subject: null }),
      permissions: {
        view: true, // Default view permission
        edit: false, // Edit permission must be explicitly granted
        delete: false,
        manageTeachers: false,
        manageClassrooms: false
      },
      isActive: true
    });

    const savedTeacher = await teacher.save();

    // Add teacher to organisation's teachers array
    organisation.teachers.push(savedTeacher._id);
    await organisation.save();

    res.status(201).json({ 
      message: 'Teacher registered successfully', 
      teacher: savedTeacher,
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

    // Get all teachers for this organisation
    const teachers = await Teacher.find({ organisationId });

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      teachers 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
});

// GET: Get a specific teacher in an organisation
router.get('/:organisationId/teachers/:teacherId', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Get specific teacher for this organisation
    const teacher = await Teacher.findOne({ id: teacherId, organisationId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this organisation' });
    }

    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      teacher 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher', error: error.message });
  }
});

// PUT: Update a teacher in an organisation
router.put('/:organisationId/teachers/:teacherId', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;
    const { name, subjects, classes, scheduleRows, scheduleColumns } = req.body;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Update teacher
    const teacher = await Teacher.findOneAndUpdate(
      { id: teacherId, organisationId },
      { 
        name, 
        subjects, 
        classes, 
        scheduleRows, 
        scheduleColumns,
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this organisation' });
    }

    res.status(200).json({ 
      message: 'Teacher updated successfully',
      organisation: organisation.organisation.organisationId,
      teacher 
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating teacher', error: error.message });
  }
});

// DELETE: Remove a teacher from an organisation
router.delete('/:organisationId/teachers/:teacherId', async (req, res) => {
  try {
    const { organisationId, teacherId } = req.params;

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Find and delete teacher
    const teacher = await Teacher.findOneAndDelete({ id: teacherId, organisationId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this organisation' });
    }

    // Remove teacher from organisation's teachers array
    organisation.teachers = organisation.teachers.filter(
      teacherRef => teacherRef.toString() !== teacher._id.toString()
    );
    await organisation.save();

    res.status(200).json({ 
      message: 'Teacher removed successfully',
      organisation: organisation.organisation.organisationId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing teacher', error: error.message });
  }
});

module.exports = router;
