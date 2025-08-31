// router/Teacher.js
const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Organisation = require('../models/Organisation');

// GET all teachers (now requires organisationId query parameter)
router.get('/', async (req, res) => {
  try {
    const { organisationId } = req.query;
    
    if (!organisationId) {
      return res.status(400).json({ message: 'organisationId query parameter is required' });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    const teachers = await Teacher.find({ organisationId }); // Fetch teachers for specific organisation
    res.status(200).json({ 
      organisation: organisation.organisation.organisationId,
      teachers 
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
});
// GET teacher by ID (now requires organisationId query parameter)
router.get('/:id', async (req, res) => {
  try {
    const { organisationId } = req.query;
    
    if (!organisationId) {
      return res.status(400).json({ message: 'organisationId query parameter is required' });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    const teacher = await Teacher.findOne({ id: req.params.id, organisationId });
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

// CREATE a new teacher (now requires organisationId in body)
router.post('/', async (req, res) => {
  try {
    const { id, organisationId, name, subjects, classes, scheduleRows, scheduleColumns } = req.body;
    
    if (!organisationId) {
      return res.status(400).json({ message: 'organisationId is required' });
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

    const teacher = new Teacher({
      id,
      organisationId,
      name,
      subjects,
      classes,
      scheduleRows: scheduleRows || 7,
      scheduleColumns: scheduleColumns || 8,
      schedule: new Array((scheduleRows || 7) * (scheduleColumns || 8)).fill({ classroom: null, subject: null })
    });

    const savedTeacher = await teacher.save();

    // Add teacher to organisation's teachers array
    organisation.teachers.push(savedTeacher._id);
    await organisation.save();

    res.status(201).json({ 
      message: 'Teacher created successfully',
      organisation: organisation.organisation.organisationId,
      teacher: savedTeacher 
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating teacher', error: error.message });
  }
});

// UPDATE teacher by ID (now requires organisationId in body)
router.put('/:id', async (req, res) => {
  try {
    const { organisationId, name, subjects, classes, scheduleRows, scheduleColumns } = req.body;
    
    if (!organisationId) {
      return res.status(400).json({ message: 'organisationId is required' });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }
    
    const teacher = await Teacher.findOneAndUpdate(
      { id: req.params.id, organisationId },
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

// DELETE teacher by ID (now requires organisationId query parameter)
router.delete('/:id', async (req, res) => {
  try {
    const { organisationId } = req.query;
    
    if (!organisationId) {
      return res.status(400).json({ message: 'organisationId query parameter is required' });
    }

    // Check if organisation exists
    const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    const teacher = await Teacher.findOneAndDelete({ id: req.params.id, organisationId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this organisation' });
    }

    // Remove teacher from organisation's teachers array
    organisation.teachers = organisation.teachers.filter(
      teacherRef => teacherRef.toString() !== teacher._id.toString()
    );
    await organisation.save();

    res.status(200).json({ 
      message: 'Teacher deleted successfully',
      organisation: organisation.organisation.organisationId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
});

module.exports = router;