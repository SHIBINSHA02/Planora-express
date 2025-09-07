const mongoose = require('mongoose');

// Schema for individual organization membership (removed 'schedule' field - now computed from classroom grids)
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
  // Array of organization memberships (no schedule here)
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

// Method to check if teacher has edit access for a specific organization (unchanged)
teacherSchema.methods.hasEditAccess = function(organisationId) {
  const orgMembership = this.organizations.find(org => org.organisationId === organisationId);
  return this.isActive && orgMembership && orgMembership.isActive && orgMembership.permissions.edit;
};

// Method to get teacher's organization membership (unchanged)
teacherSchema.methods.getOrganizationMembership = function(organisationId) {
  return this.organizations.find(org => org.organisationId === organisationId);
};

// Method to get all organizations the teacher belongs to (unchanged)
teacherSchema.methods.getOrganizations = function() {
  return this.organizations.map(org => org.organisationId);
};

// Method to get organization details for a specific organization (updated populate for array classrooms)
teacherSchema.methods.getOrganisationDetails = async function(organisationId) {
  const Organisation = require('./Organisation');
  return await Organisation.findOne({ 'organisation.organisationId': organisationId })
    .populate('teachers')
    .populate('classrooms.assignedTeacher')
    .populate('classrooms.assignedTeachers');
};

// Method to check if teacher belongs to a specific organisation (unchanged)
teacherSchema.methods.belongsToOrganisation = function(organisationId) {
  return this.organizations.some(org => org.organisationId === organisationId);
};

// Method to get teacher's schedule size based on organisation settings (unchanged)
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

// Method to add teacher to a new organization (updated: no schedule init, as it's computed)
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

  // Add organization membership (no schedule - computed later)
  this.organizations.push({
    organisationId,
    subjects,
    classes,
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

// Method to remove teacher from an organization (unchanged)
teacherSchema.methods.removeFromOrganization = function(organisationId) {
  const orgIndex = this.organizations.findIndex(org => org.organisationId === organisationId);
  if (orgIndex === -1) {
    throw new Error('Teacher is not a member of this organization');
  }
  
  this.organizations.splice(orgIndex, 1);
  return this.save();
};

// Method to update organization-specific data (unchanged, removed schedule update)
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

// New method: Compute teacher's schedule from classroom grids (supports 5 days, variable periods)
teacherSchema.methods.getMySchedule = async function(organisationId) {
  const Organisation = require('./Organisation');
  const organisation = await Organisation.findByOrganisationId(organisationId);
  if (!organisation || !this.belongsToOrganisation(organisationId)) {
    throw new Error('Teacher not in this organization or organization not found');
  }

  const { daysCount, periodCount, totalSlots } = {
    daysCount: organisation.daysCount, // Default 5
    periodCount: organisation.periodCount, // Variable
    totalSlots: organisation.daysCount * organisation.periodCount
  };

  // Initialize empty schedule array (flattened slots)
  const schedule = Array(totalSlots).fill(null);

  // Aggregate assignments from all classrooms' grids
  for (const classroom of organisation.classrooms) {
    for (let cellIdx = 0; cellIdx < classroom.grid.length; cellIdx++) {
      const cell = classroom.grid[cellIdx];
      if (cell.teachers && cell.teachers.some(tId => tId.toString() === this._id.toString())) {
        let slot = schedule[cellIdx];
        if (!slot) {
          slot = {
            classroom: classroom.classroomId,
            subjects: [],
            // Note: teachers include this teacher, but for display, we can omit self-listing
          };
        }
        // Append subjects (handle multiples)
        slot.subjects.push(...(cell.subjects || []));
        schedule[cellIdx] = slot;
      }
    }
  }

  // Clean up: remove duplicates in subjects if needed
  schedule.forEach(slot => {
    if (slot && slot.subjects.length > 0) {
      slot.subjects = [...new Set(slot.subjects)]; // Unique subjects
    }
  });

  return { schedule, daysCount, periodCount }; // Return with metadata for frontend rendering
};

// Indexes for efficient querying (unchanged)
teacherSchema.index({ id: 1 }, { unique: true }); // Global unique teacher ID
teacherSchema.index({ email: 1 }, { unique: true }); // Unique email
teacherSchema.index({ name: 1 });
teacherSchema.index({ 'organizations.organisationId': 1 }); // Index for organization queries
teacherSchema.index({ 'organizations.subjects': 1 }); // Index for subject queries
teacherSchema.index({ 'organizations.classes': 1 }); // Index for class queries
teacherSchema.index({ isActive: 1 });

// Static methods for teacher operations (unchanged)
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