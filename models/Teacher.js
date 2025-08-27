// models/Teacher.js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true, // Ensure the ID is unique
  },
  name: {
    type: String,
    required: true,
    trim: true, // Remove extra whitespace
  },
  subjects: {
    type: [String], // Array of strings for subjects
    required: true,
    validate: {
      validator: function (arr) {
        return arr.length > 0; // Ensure at least one subject
      },
      message: 'At least one subject is required',
    },
  },
  classes: {
    type: [String], // Array of strings for classes
    required: true,
    validate: {
      validator: function (arr) {
        return arr.length > 0; // Ensure at least one class
      },
      message: 'At least one class is required',
    },
  },
  schedule: {
    type: [[{ // 2D array for M*N grid
      classroom: {
        type: String,
        trim: true,
        default: null, // Allow null for unassigned slots
      },
      subject: {
        type: String,
        trim: true,
        default: null, // Allow null for unassigned slots
        validate: {
          validator: function (value) {
            // Ensure subject is either null or in teacher's subjects
            return value === null || this.subjects.includes(value);
          },
          message: 'Subject must be one of the teacher\'s assigned subjects',
        },
      },
    }]],
    default: [], // Initialize as empty array
  },
}, {
  timestamps: true, // Add createdAt and updatedAt fields
});

// Create and export the model
const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;





