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
    default: 8
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

// Create and export the Organisation model
const Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;
