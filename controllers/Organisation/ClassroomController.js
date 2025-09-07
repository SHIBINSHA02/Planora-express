// controllers/Organisation/ClassroomController.js
const Organisation = require('../../models/Organisation');
const { checkTeachersExistInOrganisation } = require('../Teacher/Teacher');
const isEmpty = require('is-empty');

class ClassroomController {
  // Create a new classroom within an organisation
  static async createClassroom(req, res) {
    try {
      const { organisationId, classroomId, classroomName, assignedTeacher, assignedTeachers, assignedSubjects } = req.body;

      // Validate input
      if (isEmpty(organisationId) || isEmpty(classroomId) || isEmpty(classroomName)) {
        return res.status(400).json({ message: 'organisationId, classroomId, and classroomName are required' });
      }

      // Check if organisation exists
      const organisation = await Organisation.findByOrganisationId(organisationId);
      if (!organisation) {
        return res.status(404).json({ message: 'Organisation not found' });
      }

      // Check if classroom already exists
      const existingClassroom = organisation.getClassroomById(classroomId);
      if (existingClassroom) {
        return res.status(400).json({ message: 'Classroom with this ID already exists in the organisation' });
      }

      // Validate teacher existence and IDs within the organisation if provided
      if (assignedTeacher) {
        const assignedTeacherCheck = await checkTeachersExistInOrganisation(assignedTeacher, organisationId);
        if (!assignedTeacherCheck.success) {
          return res.status(400).json({ message: assignedTeacherCheck.message });
        }
      }

      if (assignedTeachers && assignedTeachers.length > 0) {
        const assignedTeachersCheck = await checkTeachersExistInOrganisation(assignedTeachers, organisationId);
        if (!assignedTeachersCheck.success) {
          return res.status(400).json({ message: assignedTeachersCheck.message });
        }
      }

      // Use the static method to create classroom with initialized grid
      const newClassroom = await Organisation.createClassroom(organisationId, {
        classroomId,
        classroomName,
        assignedTeacher: assignedTeacher || null,
        assignedTeachers: assignedTeachers || [],
        assignedSubjects: assignedSubjects || []
      });

      res.status(201).json({ 
        message: 'Classroom created successfully', 
        classroom: newClassroom,
        organisation: organisationId
      });
    } catch (error) {
      res.status(400).json({ message: 'Error creating classroom', error: error.message });
    }
  }

  // Retrieve a classroom by organisationId and classroomId
  static async getClassroom(req, res) {
    try {
      const { organisationId, classroomId } = req.params;
      
      // Find organisation and populate classroom data
      const organisation = await Organisation.findByOrganisationId(organisationId)
        .populate('classrooms.assignedTeacher')
        .populate('classrooms.assignedTeachers')
        .populate('classrooms.grid.teachers');

      if (!organisation) {
        return res.status(404).json({ message: 'Organisation not found' });
      }

      // Find the specific classroom
      const classroom = organisation.getClassroomById(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: 'Classroom not found' });
      }

      res.status(200).json({
        classroom: classroom,
        organisation: organisationId
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving classroom', error: error.message });
    }
  }

  // Update an entire classroom by organisationId and classroomId
  static async updateClassroom(req, res) {
    try {
      const { organisationId, classroomId } = req.params;
      const { classroomName, assignedTeacher, assignedTeachers, assignedSubjects, grid } = req.body;

      // Validate input - at least one field must be provided
      if (isEmpty(classroomName) && isEmpty(assignedTeacher) && isEmpty(assignedTeachers) && isEmpty(assignedSubjects) && isEmpty(grid)) {
        return res.status(400).json({ message: 'At least one field must be provided for update' });
      }

      // Find organisation
      const organisation = await Organisation.findByOrganisationId(organisationId);
      if (!organisation) {
        return res.status(404).json({ message: 'Organisation not found' });
      }

      // Find the specific classroom
      const classroom = organisation.getClassroomById(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: 'Classroom not found' });
      }

      // Validate teacher existence and IDs within the organisation if provided
      if (assignedTeacher) {
        const assignedTeacherCheck = await checkTeachersExistInOrganisation(assignedTeacher, organisationId);
        if (!assignedTeacherCheck.success) {
          return res.status(400).json({ message: assignedTeacherCheck.message });
        }
      }

      if (assignedTeachers && assignedTeachers.length > 0) {
        const assignedTeachersCheck = await checkTeachersExistInOrganisation(assignedTeachers, organisationId);
        if (!assignedTeachersCheck.success) {
          return res.status(400).json({ message: assignedTeachersCheck.message });
        }
      }

      // Update classroom fields
      if (classroomName) classroom.classroomName = classroomName;
      if (assignedTeacher !== undefined) classroom.assignedTeacher = assignedTeacher;
      if (assignedTeachers !== undefined) classroom.assignedTeachers = assignedTeachers;
      if (assignedSubjects !== undefined) classroom.assignedSubjects = assignedSubjects;
      if (grid !== undefined) classroom.grid = grid;

      // Save the organisation
      await organisation.save();

      // Populate the updated classroom data
      await organisation.populate('classrooms.assignedTeacher');
      await organisation.populate('classrooms.assignedTeachers');
      await organisation.populate('classrooms.grid.teachers');

      const updatedClassroom = organisation.getClassroomById(classroomId);

      res.status(200).json({ 
        message: 'Classroom updated successfully', 
        classroom: updatedClassroom,
        organisation: organisationId
      });
    } catch (error) {
      res.status(400).json({ message: 'Error updating classroom', error: error.message });
    }
  }
}

module.exports = ClassroomController;
