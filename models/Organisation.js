// models/Organisation.js
const mongoose = require('mongoose');

// Define the schema for a single grid cell within a classroom
const gridCellSchema = new mongoose.Schema({
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  subjects: [String]
});

// Define the schema for a classroom
const classroomSchema = new mongoose.Schema({
  classroomId: {
    type: String,
    required: true
  },
  classroomName: {
    type: String,
    required: true,
    trim: true
  },
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  assignedTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  assignedSubjects: [String],
  // The grid is an array of gridCellSchema objects (flattened: totalSlots = daysCount * periodCount)
  grid: [gridCellSchema]
});

// Define the main organisation schema
const organisationSchema = new mongoose.Schema({
  organisation: {
    organisationId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    admin: {
      type: String,
      required: true
    }
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  // Organization-level settings for all classrooms
  periodCount: {
    type: Number,
    required: true,
    default: 6
  },
  daysCount: {
    type: Number,
    required: true,
    default: 5
  },
  classrooms: [classroomSchema], // Changed to array to support multiple classrooms
});

// Methods for managing teachers in the organisation (unchanged)
organisationSchema.methods.addTeacher = function(teacherId) {
  if (!this.teachers.includes(teacherId)) {
    this.teachers.push(teacherId);
  }
  return this.save();
};

organisationSchema.methods.removeTeacher = function(teacherId) {
  this.teachers = this.teachers.filter(id => id.toString() !== teacherId.toString());
  return this.save();
};

organisationSchema.methods.getTeachers = function() {
  return this.populate('teachers');
};

// Method to get all teachers with full details for this organization (unchanged)
organisationSchema.methods.getAllTeachers = async function() {
  const Teacher = require('./Teacher');
  return await Teacher.findTeachersInOrganization(this.organisation.organisationId);
};

// Method to get a specific teacher by ID in this organization (unchanged)
organisationSchema.methods.getTeacherById = async function(teacherId) {
  const Teacher = require('./Teacher');
  const teacher = await Teacher.findByTeacherId(teacherId);
  if (teacher && teacher.belongsToOrganisation(this.organisation.organisationId)) {
    return teacher;
  }
  return null;
};

// Method to get teachers by subject in this organization (unchanged)
organisationSchema.methods.getTeachersBySubject = async function(subject) {
  const Teacher = require('./Teacher');
  return await Teacher.find({ 
    'organizations.organisationId': this.organisation.organisationId,
    'organizations.subjects': { $in: [subject] }
  });
};

// Method to get teachers by class in this organization (unchanged)
organisationSchema.methods.getTeachersByClass = async function(className) {
  const Teacher = require('./Teacher');
  return await Teacher.find({ 
    'organizations.organisationId': this.organisation.organisationId,
    'organizations.classes': { $in: [className] }
  });
};

// Method to check if a teacher exists in this organisation (unchanged)
organisationSchema.methods.hasTeacher = async function(teacherId) {
  const Teacher = require('./Teacher');
  const teacher = await Teacher.findByTeacherId(teacherId);
  return teacher ? teacher.belongsToOrganisation(this.organisation.organisationId) : false;
};

// Method to get teacher count for this organization (unchanged)
organisationSchema.methods.getTeacherCount = async function() {
  const Teacher = require('./Teacher');
  return await Teacher.countDocuments({ 
    'organizations.organisationId': this.organisation.organisationId
  });
};

// Method to get active teachers only for this organization (unchanged)
organisationSchema.methods.getActiveTeachers = async function() {
  const Teacher = require('./Teacher');
  return await Teacher.findActiveTeachersInOrganization(this.organisation.organisationId);
};

// New method to get a specific classroom by ID (for services like getClassroom)
organisationSchema.methods.getClassroomById = function(classroomId) {
  return this.classrooms.find(cls => cls.classroomId === classroomId);
};

// New static method to create a classroom with initialized grid (call via service when creating)
organisationSchema.statics.createClassroom = async function(organisationId, classroomData) {
  const organisation = await this.findByOrganisationId(organisationId);
  if (!organisation) {
    throw new Error('Organisation not found');
  }

  // Initialize grid with size based on org settings (5 days * periodCount cells, empty)
  const totalSlots = organisation.daysCount * organisation.periodCount;
  const grid = Array.from({ length: totalSlots }, () => ({
    teachers: [],
    subjects: []
  }));

  // Create new classroom object directly
  const newClassroom = {
    ...classroomData,
    grid
  };

  organisation.classrooms.push(newClassroom);
  await organisation.save();

  // Return the newly added classroom
  return organisation.classrooms[organisation.classrooms.length - 1];
};

// Static methods for organisation-level teacher operations (unchanged, but adjusted for array classrooms)
organisationSchema.statics.findByOrganisationId = function(organisationId) {
  return this.findOne({ 'organisation.organisationId': organisationId });
};

organisationSchema.statics.getTeachersForOrganisation = async function(organisationId) {
  const Teacher = require('./Teacher');
  return await Teacher.findTeachersInOrganization(organisationId);
};

organisationSchema.statics.addTeacherToOrganisation = async function(organisationId, teacherData) {
  const Teacher = require('./Teacher');
  const organisation = await this.findByOrganisationId(organisationId);
  
  if (!organisation) {
    throw new Error('Organisation not found');
  }
  
  // Check if teacher already exists globally
  let teacher = await Teacher.findByTeacherId(teacherData.id);
  
  if (teacher) {
    // Teacher exists, add to this organization
    if (teacher.belongsToOrganisation(organisationId)) {
      throw new Error('Teacher is already a member of this organization');
    }
    
    await teacher.addToOrganization(
      organisationId, 
      teacherData.subjects, 
      teacherData.classes, 
      teacherData.permissions
    );
  } else {
    // Create new teacher
    teacher = new Teacher({
      id: teacherData.id,
      name: teacherData.name,
      email: teacherData.email,
      phone: teacherData.phone,
      bio: teacherData.bio,
      profilePicture: teacherData.profilePicture,
      globalPermissions: teacherData.globalPermissions || { view: true, edit: false },
      isActive: true
    });
    
    // Add to organization (initializes without schedule, as it's now computed)
    await teacher.addToOrganization(
      organisationId, 
      teacherData.subjects, 
      teacherData.classes, 
      teacherData.permissions
    );
    
    await teacher.save();
  }
  
  // Add teacher to organisation's teachers array
  await organisation.addTeacher(teacher._id);
  
  return teacher;
};

organisationSchema.statics.removeTeacherFromOrganisation = async function(organisationId, teacherId) {
  const Teacher = require('./Teacher');
  const organisation = await this.findByOrganisationId(organisationId);
  
  if (!organisation) {
    throw new Error('Organisation not found');
  }
  
  // Find teacher
  const teacher = await Teacher.findByTeacherId(teacherId);
  
  if (teacher && teacher.belongsToOrganisation(organisationId)) {
    // Remove teacher from this organization
    await teacher.removeFromOrganization(organisationId);
    
    // Remove teacher from organisation's teachers array
    await organisation.removeTeacher(teacher._id);
    
    // If teacher has no other organizations, deactivate them
    if (teacher.organizations.length === 0) {
      teacher.isActive = false;
      await teacher.save();
    }
  }
  
  return teacher;
};

// Method to get teacher's organization-specific data (unchanged)
organisationSchema.statics.getTeacherOrganizationData = async function(organisationId, teacherId) {
  const Teacher = require('./Teacher');
  const teacher = await Teacher.findByTeacherId(teacherId);
  
  if (!teacher || !teacher.belongsToOrganisation(organisationId)) {
    return null;
  }
  
  return teacher.getOrganizationMembership(organisationId);
};

// Updated method to get organisation details (adjusted populate for array of classrooms)
organisationSchema.methods.getOrganisationDetails = async function() {
  return await this.model('Organisation').findById(this._id)
    .populate('teachers')
    .populate('classrooms.assignedTeacher')
    .populate('classrooms.assignedTeachers');
};

// Indexes (added for classroomId queries)
organisationSchema.index({ 'classrooms.classroomId': 1 });

// Create and export the Organisation model
const Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;