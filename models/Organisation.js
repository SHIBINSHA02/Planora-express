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
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  assignedTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  assignedSubjects: [String],
  // The grid is an array of gridCellSchema objects
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
  classrooms: {
    type: classroomSchema, // Classrooms is a subdocument
    required: true
  },
  
});

// Methods for managing teachers in the organisation
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

// Method to get all teachers with full details for this organization
organisationSchema.methods.getAllTeachers = async function() {
  const Teacher = require('./Teacher');
  return await Teacher.findTeachersInOrganization(this.organisation.organisationId);
};

// Method to get a specific teacher by ID in this organization
organisationSchema.methods.getTeacherById = async function(teacherId) {
  const Teacher = require('./Teacher');
  const teacher = await Teacher.findByTeacherId(teacherId);
  if (teacher && teacher.belongsToOrganisation(this.organisation.organisationId)) {
    return teacher;
  }
  return null;
};

// Method to get teachers by subject in this organization
organisationSchema.methods.getTeachersBySubject = async function(subject) {
  const Teacher = require('./Teacher');
  return await Teacher.find({ 
    'organizations.organisationId': this.organisation.organisationId,
    'organizations.subjects': { $in: [subject] }
  });
};

// Method to get teachers by class in this organization
organisationSchema.methods.getTeachersByClass = async function(className) {
  const Teacher = require('./Teacher');
  return await Teacher.find({ 
    'organizations.organisationId': this.organisation.organisationId,
    'organizations.classes': { $in: [className] }
  });
};

// Method to check if a teacher exists in this organisation
organisationSchema.methods.hasTeacher = async function(teacherId) {
  const Teacher = require('./Teacher');
  const teacher = await Teacher.findByTeacherId(teacherId);
  return teacher ? teacher.belongsToOrganisation(this.organisation.organisationId) : false;
};

// Method to get teacher count for this organization
organisationSchema.methods.getTeacherCount = async function() {
  const Teacher = require('./Teacher');
  return await Teacher.countDocuments({ 
    'organizations.organisationId': this.organisation.organisationId
  });
};

// Method to get active teachers only for this organization
organisationSchema.methods.getActiveTeachers = async function() {
  const Teacher = require('./Teacher');
  return await Teacher.findActiveTeachersInOrganization(this.organisation.organisationId);
};

// Static methods for organisation-level teacher operations
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
    
    // Add to organization
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

// Method to get teacher's organization-specific data
organisationSchema.statics.getTeacherOrganizationData = async function(organisationId, teacherId) {
  const Teacher = require('./Teacher');
  const teacher = await Teacher.findByTeacherId(teacherId);
  
  if (!teacher || !teacher.belongsToOrganisation(organisationId)) {
    return null;
  }
  
  return teacher.getOrganizationMembership(organisationId);
};

// Create and export the Organisation model
const Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;
