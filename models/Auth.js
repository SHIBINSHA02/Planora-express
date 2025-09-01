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
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'teacher', 'viewer'],
    default: 'viewer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  organizationAccess: [organizationAccessSchema],
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
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

// Virtual for account locked status
authSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to check if user has access to an organization
authSchema.methods.hasAccessToOrganization = function(organisationId, permission = 'view') {
  if (this.role === 'super_admin') {
    return true; // Super admin has access to everything
  }
  
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
  if (this.role === 'super_admin') {
    return []; // Super admin doesn't need specific organization access
  }
  
  return this.organizationAccess
    .filter(access => access.permissions[permission])
    .map(access => ({
      organisationId: access.organisationId,
      organisationName: access.organisationName,
      permissions: access.permissions
    }));
};

// Method to increment login attempts
authSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
authSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
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
authSchema.index({ role: 1 });
authSchema.index({ isActive: 1 });
authSchema.index({ 'organizationAccess.organisationId': 1 });

// Create and export the model
const Auth = mongoose.model('Auth', authSchema);
module.exports = Auth;