// models/Auth.js
const mongoose = require('mongoose');

// Define the schema for organization access permissions
const organizationAccessSchema = new mongoose.Schema({
  organisationId: {
    type: String,
    required: true,
    ref: 'Organisation'
  },
  organisationName: {
    type: String,
    required: true
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
  grantedBy: {
    type: String, // User ID who granted the access
    required: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
  }
});

// Define the main authentication schema
const authSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true // This property automatically creates a unique index
  },
  username: {
    type: String,
    required: true,
    unique: true, // This property automatically creates a unique index
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true, // This property automatically creates a unique index
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  organizationAccess: [organizationAccessSchema],
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for full name
authSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});



// Method to check if user has access to an organization
authSchema.methods.hasAccessToOrganization = function(organisationId, permission = 'view') {
  const access = this.organizationAccess.find(access => 
    access.organisationId === organisationId && access.permissions[permission]
  );
  
  return !!access;
};

// Method to grant access to an organization
authSchema.methods.grantOrganizationAccess = function(organisationId, organisationName, permissions, grantedBy) {
  // Remove existing access if any
  this.organizationAccess = this.organizationAccess.filter(
    access => access.organisationId !== organisationId
  );
  
  // Add new access
  this.organizationAccess.push({
    organisationId,
    organisationName,
    permissions,
    grantedBy,
    grantedAt: new Date()
  });
  
  return this.save();
};

// Method to revoke access to an organization
authSchema.methods.revokeOrganizationAccess = function(organisationId) {
  this.organizationAccess = this.organizationAccess.filter(
    access => access.organisationId !== organisationId
  );
  
  return this.save();
};

// Method to get accessible organizations
authSchema.methods.getAccessibleOrganizations = function(permission = 'view') {
  return this.organizationAccess
    .filter(access => access.permissions[permission])
    .map(access => ({
      organisationId: access.organisationId,
      organisationName: access.organisationName,
      permissions: access.permissions
    }));
};



// Method to update last login
authSchema.methods.updateLastLogin = function() {
  return this.updateOne({
    $set: { lastLogin: new Date() }
  });
};

// Pre-save middleware to generate userId if not provided
authSchema.pre('save', function(next) {
  if (!this.userId) {
    this.userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Indexes for efficient querying. The unique indexes for userId, username, and email
// are created by the `unique: true` property on the schema definition.
authSchema.index({ 'organizationAccess.organisationId': 1 });

// Create and export the model
const Auth = mongoose.model('Auth', authSchema);
module.exports = Auth;