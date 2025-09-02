// controllers/Organisation/ClassroomController.js
const Organisation = require('../../models/Organisation');
const { checkTeachersExistInOrganisation } = require('../Teacher/Teacher');
const isEmpty = require('is-empty');

class ClassroomController {
  // Create a new classroom within an organisation
  static async createClassroom(req, res) {
    try {
      const { organisationId, name, admin, classroomId, classroomName, assignedTeacher, assignedTeachers, assignedSubjects, grid, periodCount, daysCount } = req.body;

      // Validate input
      if (isEmpty(organisationId) || isEmpty(name) || isEmpty(admin) || isEmpty(classroomId) || isEmpty(classroomName) || isEmpty(assignedTeacher) || isEmpty(assignedTeachers) || isEmpty(assignedSubjects) || isEmpty(grid)) {
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
        periodCount: periodCount || 8,
        daysCount: daysCount || 5,
        classrooms: {
          classroomId,
          classroomName,
          assignedTeacher,
          assignedTeachers,
          assignedSubjects,
          grid
        }
      });

      await organisation.save();
      res.status(201).json({ message: 'Classroom created', organisation });
    } catch (error) {
      res.status(400).json({ message: 'Error creating classroom', error: error.message });
    }
  }

  // Retrieve a classroom by organisationId and classroomId
  static async getClassroom(req, res) {
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
  }

  // Update an entire classroom by organisationId and classroomId
  static async updateClassroom(req, res) {
    try {
      const { organisationId, classroomId } = req.params;
      const { classroomName, assignedTeacher, assignedTeachers, assignedSubjects, grid } = req.body;

      // Validate input
      if (isEmpty(classroomName) || isEmpty(assignedTeacher) || isEmpty(assignedTeachers) || isEmpty(assignedSubjects) || isEmpty(grid)) {
        return res.status(400).json({ message: 'All fields (classroomName, assignedTeacher, assignedTeachers, assignedSubjects, grid) are required' });
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
            'classrooms.classroomName': classroomName,
            'classrooms.assignedTeacher': assignedTeacher,
            'classrooms.assignedTeachers': assignedTeachers,
            'classrooms.assignedSubjects': assignedSubjects,
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
  }
}

module.exports = ClassroomController;
