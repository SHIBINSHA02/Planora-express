// controllers/Teacher/Teacher.js
const mongoose = require('mongoose');
const Teacher = require('../../models/Teacher'); // Path to your Teacher model

// Helper function to validate teacher IDs
const checkTeachersExist = async (teacherIds) => {
  const validIds = Array.isArray(teacherIds) ? teacherIds : [teacherIds];
  if (validIds.length === 0) {
    return { success: true, message: 'No teachers to validate.' };
  }

  // Ensure all IDs are valid Mongoose ObjectIds
  for (const id of validIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, message: `Invalid ObjectId format for ID: ${id}` };
    }
  }

  // Check if teachers exist in the database
  const foundTeachers = await Teacher.find({ '_id': { '$in': validIds } });

  if (foundTeachers.length !== validIds.length) {
    return { success: false, message: 'One or more teacher IDs do not exist.' };
  }
  return { success: true, message: 'All teachers exist.' };
};

// Helper function to validate teacher IDs within a specific organisation
const checkTeachersExistInOrganisation = async (teacherIds, organisationId) => {
  const validIds = Array.isArray(teacherIds) ? teacherIds : [teacherIds];
  if (validIds.length === 0) {
    return { success: true, message: 'No teachers to validate.' };
  }

  // Ensure all IDs are valid Mongoose ObjectIds
  for (const id of validIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, message: `Invalid ObjectId format for ID: ${id}` };
    }
  }

  // Check if teachers exist in the database and belong to the specified organisation
  const foundTeachers = await Teacher.find({ 
    '_id': { '$in': validIds },
    'organizations.organisationId': organisationId 
  });

  if (foundTeachers.length !== validIds.length) {
    return { success: false, message: 'One or more teacher IDs do not exist in this organisation.' };
  }
  return { success: true, message: 'All teachers exist in this organisation.' };
};

module.exports = {
  checkTeachersExist,
  checkTeachersExistInOrganisation
};