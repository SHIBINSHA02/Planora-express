// router/Organisation.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const isEmpty = require('is-empty');

const Organisation = require('../models/Organisation'); // Updated to use Organisation model
const Teacher = require('../models/Teacher'); // Path to Teacher model
const { checkTeachersExist, checkTeachersExistInOrganisation } = require('../controllers/Teacher/Teacher'); // Import the functions

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

    // Create new teacher
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

// POST: Create a new classroom within an organisation
router.post('/', async (req, res) => {
  try {
    const { organisationId, name, admin, classroomId, assignedTeacher, assignedTeachers, assignedSubjects, rows, columns, grid } = req.body;

    // Validate input
    if (isEmpty(organisationId) || isEmpty(name) || isEmpty(admin) || isEmpty(classroomId) || isEmpty(assignedTeacher) || isEmpty(assignedTeachers) || isEmpty(assignedSubjects) || isEmpty(rows) || isEmpty(columns) || isEmpty(grid)) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate teacher existence and IDs within the organisation
    const assignedTeacherCheck = await checkTeachersExistInOrganisation(assignedTeacher, organisationId);
    const assignedTeachersCheck = await checkTeachersExistInOrganisation(assignedTeachers, organisationId);

    if (!assignedTeacherCheck.success) {
      return res.status(400).json({ message: assignedTeacherCheck.message });
    }
    if (!assignedTeachersCheck.success) {
      return res.status(400).json({ message: assignedTeachersCheck.message });
    }
    
    // Create and save organisation with classroom
    const organisation = new Organisation({
      organisation: {
        organisationId,
        name,
        admin
      },
      classrooms: {
        classroomId,
        assignedTeacher,
        assignedTeachers,
        assignedSubjects,
        rows,
        columns,
        grid
      }
    });

    await organisation.save();
    res.status(201).json({ message: 'Classroom created', organisation });
  } catch (error) {
    res.status(400).json({ message: 'Error creating classroom', error: error.message });
  }
});
// GET: Retrieve a classroom by organisationId and classroomId
router.get('/:organisationId/classroom/:classroomId', async (req, res) => {
  try {
    const { organisationId, classroomId } = req.params;
    const organisation = await Organisation.findOne({
        'organisation.organisationId': organisationId,
        'classrooms.classroomId': classroomId
      })
      .populate('classrooms.assignedTeacher')
      .populate('classrooms.assignedTeachers')
      .populate('classrooms.grid.teachers');

    if (!organisation || !organisation.classrooms) {
      return res.status(404).json({ message: 'Classroom or Organisation not found' });
    }

    res.status(200).json(organisation.classrooms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving classroom', error: error.message });
  }
});

router.patch('/:organisationId/classroom/:classroomId/grid/:row/:col', async (req, res) => {
  try {
    const { organisationId, classroomId, row, col } = req.params;
    const { teachers, subjects } = req.body;

    // Validate input
    if (isEmpty(teachers) || !Array.isArray(teachers) || isEmpty(subjects) || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Teachers and subjects must be arrays' });
    }

    const organisation = await Organisation.findOne({
      'organisation.organisationId': organisationId,
      'classrooms.classroomId': classroomId
    });
    if (!organisation || !organisation.classrooms) {
      return res.status(404).json({ message: 'Classroom or Organisation not found' });
    }

    const rowIndex = parseInt(row);
    const colIndex = parseInt(col);
    const {
      rows,
      columns
    } = organisation.classrooms;
    if (
      isNaN(rowIndex) || rowIndex < 0 || rowIndex >= rows ||
      isNaN(colIndex) || colIndex < 0 || colIndex >= columns
    ) {
      return res.status(400).json({ message: 'Invalid row or column index' });
    }

    // Update the specific grid cell
    organisation.classrooms.grid[rowIndex * columns + colIndex] = {
      teachers,
      subjects
    };

    // Validate the updated document
    await organisation.validate();

    // Save the updated organisation
    await organisation.save();
    res.status(200).json({ message: 'Grid cell updated', classrooms: organisation.classrooms });
  } catch (error) {
    res.status(400).json({ message: 'Error updating grid cell', error: error.message });
  }
});

// PUT: Update an entire classroom by organisationId and classroomId
router.put('/:organisationId/classroom/:classroomId', async (req, res) => {
  try {
    const { organisationId, classroomId } = req.params;
    const { assignedTeacher, assignedTeachers, assignedSubjects, rows, columns, grid } = req.body;

    // Validate input
    if (isEmpty(assignedTeacher) || isEmpty(assignedTeachers) || isEmpty(assignedSubjects) || isEmpty(rows) || isEmpty(columns) || isEmpty(grid)) {
      return res.status(400).json({ message: 'All fields (assignedTeacher, assignedTeachers, assignedSubjects, rows, columns, grid) are required' });
    }

    // Validate teacher existence and IDs within the organisation
    const assignedTeacherCheck = await checkTeachersExistInOrganisation(assignedTeacher, organisationId);
    const assignedTeachersCheck = await checkTeachersExistInOrganisation(assignedTeachers, organisationId);

    if (!assignedTeacherCheck.success) {
      return res.status(400).json({ message: assignedTeacherCheck.message });
    }
    if (!assignedTeachersCheck.success) {
      return res.status(400).json({ message: assignedTeachersCheck.message });
    }


    // Find and update the organisation with the classroom
    const organisation = await Organisation.findOneAndUpdate({
        'organisation.organisationId': organisationId,
        'classrooms.classroomId': classroomId
      }, {
        $set: {
          'classrooms.assignedTeacher': assignedTeacher,
          'classrooms.assignedTeachers': assignedTeachers,
          'classrooms.assignedSubjects': assignedSubjects,
          'classrooms.rows': rows,
          'classrooms.columns': columns,
          'classrooms.grid': grid,
          'classrooms.updatedAt': new Date()
        }
      }, {
        new: true,
        runValidators: true
      })
      .populate('classrooms.assignedTeacher')
      .populate('classrooms.assignedTeachers')
      .populate('classrooms.grid.teachers');

    if (!organisation || !organisation.classrooms) {
      return res.status(404).json({ message: 'Classroom or Organisation not found' });
    }

    res.status(200).json({ message: 'Classroom updated', classrooms: organisation.classrooms });
  } catch (error) {
    res.status(400).json({ message: 'Error updating classroom', error: error.message });
  }
});

module.exports = router;