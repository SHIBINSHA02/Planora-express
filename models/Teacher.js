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
  scheduleRows: {
    type: Number,
    required: true,
    min: 1,
    default: 7 // Default 7 days
  },
  scheduleColumns: {
    type: Number,
    required: true,
    min: 1,
    default: 8 // Default 8 periods per day
  },
  schedule: [{
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
          return value === null || this.parent().subjects.includes(value);
        },
        message: 'Subject must be one of the teacher\'s assigned subjects',
      },
    },
  }],
}, {
  timestamps: true, // Add createdAt and updatedAt fields
});

// Method to get schedule slot by row and column indices
teacherSchema.methods.getScheduleSlot = function(row, col) {
  const index = row * this.scheduleColumns + col;
  return this.schedule[index];
};

// Method to set schedule slot by row and column indices
teacherSchema.methods.setScheduleSlot = function(row, col, slotData) {
  const index = row * this.scheduleColumns + col;
  this.schedule[index] = slotData;
};

// Validate schedule size matches scheduleRows * scheduleColumns
teacherSchema.pre('save', function(next) {
  const expectedSize = this.scheduleRows * this.scheduleColumns;
  if (this.schedule.length !== expectedSize) {
    return next(new Error(`Schedule size ${this.schedule.length} doesn't match scheduleRows×scheduleColumns ${expectedSize}`));
  }
  next();
});

// Indexes for efficient querying
teacherSchema.index({ id: 1 });
teacherSchema.index({ name: 1 });
teacherSchema.index({ subjects: 1 });
teacherSchema.index({ classes: 1 });

// Create and export the model
const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;