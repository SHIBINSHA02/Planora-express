// models/Teacher.js
const mongoose = require('mongoose');

// Schema for individual organization membership
const organizationMembershipSchema = new mongoose.Schema({
  organisationId: {
    type: String,
    required: true,
    ref: 'Organisation'
  },
  subjects: {
    type: [String], // Array of strings for subjects in this organization
    required: true,
    validate: {
      validator: function (arr) {
        return arr.length > 0; // Ensure at least one subject
      },
      message: 'At least one subject is required for this organization',
    },
  },
  classes: {
    type: [String], // Array of strings for classes in this organization
    required: true,
    validate: {
      validator: function (arr) {
        return arr.length > 0; // Ensure at least one class
      },
      message: 'At least one class is required for this organization',
    },
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
          // Ensure subject is either null or in teacher's subjects for this organization
          return value === null || this.parent().subjects.includes(value);
        },
        message: 'Subject must be one of the teacher\'s assigned subjects for this organization',
      },
    },
  }],
  permissions: {
    view: {
      type: Boolean,
      default: true
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
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // Disable _id for subdocuments

const teacherSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true // Global unique teacher ID across all organizations
  },
  name: {
    type: String,
    required: true,
    trim: true, // Remove extra whitespace
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  // Array of organization memberships
  organizations: [organizationMembershipSchema],
  
  // Global teacher settings
  globalPermissions: {
    view: {
      type: Boolean,
      default: true
    },
    edit: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  linkedUserId: {
    type: String,
    default: null,
    ref: 'Auth'
  }
}, {
  timestamps: true, // Add createdAt and updatedAt fields
});

// Method to get schedule slot by row and column indices for a specific organization
teacherSchema.methods.getScheduleSlot = function(organisationId, row, col, periodCount) {
  const orgMembership = this.organizations.find(org => org.organisationId === organisationId);
  if (!orgMembership) {
    throw new Error('Teacher is not a member of this organization');
  }
  const index = row * periodCount + col;
  return orgMembership.schedule[index];
};

// Method to set schedule slot by row and column indices for a specific organization
teacherSchema.methods.setScheduleSlot = function(organisationId, row, col, slotData, periodCount) {
  const orgMembership = this.organizations.find(org => org.organisationId === organisationId);
  if (!orgMembership) {
    throw new Error('Teacher is not a member of this organization');
  }
  const index = row * periodCount + col;
  orgMembership.schedule[index] = slotData;
};

// Method to check if teacher has edit access for a specific organization
teacherSchema.methods.hasEditAccess = function(organisationId) {
  const orgMembership = this.organizations.find(org => org.organisationId === organisationId);
  return this.isActive && orgMembership && orgMembership.isActive && orgMembership.permissions.edit;
};

// Method to get teacher's organization membership
teacherSchema.methods.getOrganizationMembership = function(organisationId) {
  return this.organizations.find(org => org.organisationId === organisationId);
};

// Method to get all organizations the teacher belongs to
teacherSchema.methods.getOrganizations = function() {
  return this.organizations.map(org => org.organisationId);
};

// Method to get organization details for a specific organization
teacherSchema.methods.getOrganisationDetails = async function(organisationId) {
  const Organisation = require('./Organisation');
  return await Organisation.findOne({ 'organisation.organisationId': organisationId })
    .populate('teachers')
    .populate('classrooms.assignedTeacher')
    .populate('classrooms.assignedTeachers');
};

// Method to check if teacher belongs to a specific organisation
teacherSchema.methods.belongsToOrganisation = function(organisationId) {
  return this.organizations.some(org => org.organisationId === organisationId);
};

// Method to get teacher's schedule size based on organisation settings
teacherSchema.methods.getScheduleSize = async function(organisationId) {
  const organisation = await this.getOrganisationDetails(organisationId);
  if (organisation) {
    return {
      daysCount: organisation.daysCount,
      periodCount: organisation.periodCount,
      totalSlots: organisation.daysCount * organisation.periodCount
    };
  }
  return null;
};

// Method to add teacher to a new organization
teacherSchema.methods.addToOrganization = async function(organisationId, subjects, classes, permissions = {}) {
  const Organisation = require('./Organisation');
  const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
  
  if (!organisation) {
    throw new Error('Organization not found');
  }

  // Check if teacher is already a member
  if (this.belongsToOrganisation(organisationId)) {
    throw new Error('Teacher is already a member of this organization');
  }

  // Create schedule based on organization's period and days count
  const schedule = new Array(organisation.daysCount * organisation.periodCount).fill({ 
    classroom: null, 
    subject: null 
  });

  // Add organization membership
  this.organizations.push({
    organisationId,
    subjects,
    classes,
    schedule,
    permissions: {
      view: true,
      edit: false,
      delete: false,
      manageTeachers: false,
      manageClassrooms: false,
      ...permissions
    },
    isActive: true,
    joinedAt: new Date()
  });

  return this.save();
};

// Method to remove teacher from an organization
teacherSchema.methods.removeFromOrganization = function(organisationId) {
  const orgIndex = this.organizations.findIndex(org => org.organisationId === organisationId);
  if (orgIndex === -1) {
    throw new Error('Teacher is not a member of this organization');
  }
  
  this.organizations.splice(orgIndex, 1);
  return this.save();
};

// Method to update organization-specific data
teacherSchema.methods.updateOrganizationData = function(organisationId, updateData) {
  const orgMembership = this.organizations.find(org => org.organisationId === organisationId);
  if (!orgMembership) {
    throw new Error('Teacher is not a member of this organization');
  }

  // Update allowed fields
  if (updateData.subjects) orgMembership.subjects = updateData.subjects;
  if (updateData.classes) orgMembership.classes = updateData.classes;
  if (updateData.permissions) orgMembership.permissions = { ...orgMembership.permissions, ...updateData.permissions };
  if (updateData.isActive !== undefined) orgMembership.isActive = updateData.isActive;

  return this.save();
};

// Method to get teacher's schedule for a specific organization
teacherSchema.methods.getScheduleForOrganization = function(organisationId) {
  const orgMembership = this.organizations.find(org => org.organisationId === organisationId);
  if (!orgMembership) {
    throw new Error('Teacher is not a member of this organization');
  }
  return orgMembership.schedule;
};

// Method to update teacher's schedule for a specific organization
teacherSchema.methods.updateScheduleForOrganization = function(organisationId, newSchedule) {
  const orgMembership = this.organizations.find(org => org.organisationId === organisationId);
  if (!orgMembership) {
    throw new Error('Teacher is not a member of this organization');
  }
  orgMembership.schedule = newSchedule;
  return this.save();
};

// Indexes for efficient querying
teacherSchema.index({ id: 1 }, { unique: true }); // Global unique teacher ID
teacherSchema.index({ email: 1 }, { unique: true }); // Unique email
teacherSchema.index({ name: 1 });
teacherSchema.index({ 'organizations.organisationId': 1 }); // Index for organization queries
teacherSchema.index({ 'organizations.subjects': 1 }); // Index for subject queries
teacherSchema.index({ 'organizations.classes': 1 }); // Index for class queries
teacherSchema.index({ isActive: 1 });

// Static methods for teacher operations
teacherSchema.statics.findByTeacherId = function(teacherId) {
  return this.findOne({ id: teacherId });
};

teacherSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

teacherSchema.statics.findTeachersInOrganization = function(organisationId) {
  return this.find({ 'organizations.organisationId': organisationId });
};

teacherSchema.statics.findActiveTeachersInOrganization = function(organisationId) {
  return this.find({ 
    'organizations.organisationId': organisationId,
    'organizations.isActive': true,
    isActive: true
  });
};

// Create and export the model
const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;