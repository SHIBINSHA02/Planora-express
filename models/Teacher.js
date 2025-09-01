// models/Teacher.js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  organisationId: {
    type: String,
    required: true,
    ref: 'Organisation'
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
  // OTP and access control fields
  accessOTP: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  permissions: {
    view: {
      type: Boolean,
      default: false
    },
    edit: {
      type: Boolean,
      default: false
    },
    delete: {
      type: Boolean,
      default: false
    },
    manageTeachers: {
      type: Boolean,
      default: false
    },
    manageClassrooms: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
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

// Method to generate OTP for organization access
teacherSchema.methods.generateAccessOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  
  this.accessOTP = {
    code: otp,
    expiresAt: expiresAt,
    isUsed: false
  };
  
  return otp;
};

// Method to validate OTP
teacherSchema.methods.validateOTP = function(otp) {
  if (!this.accessOTP || !this.accessOTP.code) {
    return { valid: false, message: 'No OTP found' };
  }
  
  if (this.accessOTP.isUsed) {
    return { valid: false, message: 'OTP has already been used' };
  }
  
  if (new Date() > this.accessOTP.expiresAt) {
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (this.accessOTP.code !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  return { valid: true, message: 'OTP is valid' };
};

// Method to mark OTP as used
teacherSchema.methods.markOTPAsUsed = function() {
  if (this.accessOTP) {
    this.accessOTP.isUsed = true;
  }
};

// Method to check if teacher has edit access
teacherSchema.methods.hasEditAccess = function() {
  return this.isActive && this.permissions.edit;
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
teacherSchema.index({ organisationId: 1, id: 1 }, { unique: true }); // Unique teacher ID within organization
teacherSchema.index({ organisationId: 1 });
teacherSchema.index({ name: 1 });
teacherSchema.index({ subjects: 1 });
teacherSchema.index({ classes: 1 });

// Create and export the model
const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;