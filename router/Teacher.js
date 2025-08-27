// router/Teacher.js
const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

// GET teacher by ID
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ id: req.params.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher', error: error.message });
  }
});

// CREATE a new teacher
router.post('/', async (req, res) => {
  try {
    const { id, name, subjects, classes } = req.body;
    
    // Check if teacher with given ID already exists
    const existingTeacher = await Teacher.findOne({ id });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this ID already exists' });
    }

    const teacher = new Teacher({
      id,
      name,
      subjects,
      classes
    });

    const savedTeacher = await teacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    res.status(400).json({ message: 'Error creating teacher', error: error.message });
  }
});

// UPDATE teacher by ID
router.put('/:id', async (req, res) => {
  try {
    const { name, subjects, classes } = req.body;
    
    const teacher = await Teacher.findOneAndUpdate(
      { id: req.params.id },
      { name, subjects, classes, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.status(200).json(teacher);
  } catch (error) {
    res.status(400).json({ message: 'Error updating teacher', error: error.message });
  }
});

// DELETE teacher by ID
router.delete('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({ id: req.params.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
});

module.exports = router;