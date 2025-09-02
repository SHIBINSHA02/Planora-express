# Multi-Organization Teacher System

## Overview

The Teacher schema has been redesigned to support teachers belonging to multiple organizations with individual schedules, subjects, and classes for each organization. This allows teachers to work across different institutions while maintaining separate schedules and permissions for each.

## Key Changes

### 1. Teacher Schema Structure

**Before:**
- Single `organisationId` field
- Single `schedule` array
- Single set of `subjects` and `classes`
- Single `permissions` object

**After:**
- Global teacher ID (unique across all organizations)
- `organizations` array containing organization-specific data
- Each organization membership includes:
  - `organisationId`
  - `subjects` (specific to this organization)
  - `classes` (specific to this organization)
  - `schedule` (individual schedule for this organization)
  - `permissions` (organization-specific permissions)
  - `isActive` (active status in this organization)
  - `joinedAt` (when teacher joined this organization)

### 2. New Teacher Fields

```javascript
{
  id: Number,           // Global unique teacher ID
  name: String,         // Teacher's name
  email: String,        // Unique email address
  phone: String,        // Contact number
  organizations: [      // Array of organization memberships
    {
      organisationId: String,
      subjects: [String],
      classes: [String],
      schedule: [Object],
      permissions: Object,
      isActive: Boolean,
      joinedAt: Date
    }
  ],
  globalPermissions: Object,  // Global permissions
  isActive: Boolean,          // Global active status
  profilePicture: String,     // Profile image URL
  bio: String                 // Teacher biography
}
```

## Usage Examples

### Creating a Teacher

```javascript
const teacher = new Teacher({
  id: 1001,
  name: 'Dr. John Smith',
  email: 'john.smith@example.com',
  phone: '+1234567890',
  bio: 'Experienced educator',
  globalPermissions: { view: true, edit: true },
  isActive: true
});
```

### Adding Teacher to Organization

```javascript
// Add teacher to first organization
await teacher.addToOrganization('ORG001', {
  subjects: ['Mathematics', 'Physics'],
  classes: ['Grade 10', 'Grade 11'],
  permissions: {
    view: true,
    edit: true,
    manageClassrooms: true
  }
});

// Add teacher to second organization
await teacher.addToOrganization('ORG002', {
  subjects: ['Advanced Physics', 'Chemistry'],
  classes: ['Year 1', 'Year 2'],
  permissions: {
    view: true,
    edit: false
  }
});
```

### Managing Schedules

```javascript
// Get schedule size for specific organization
const scheduleSize = await teacher.getScheduleSize('ORG001');

// Set schedule slot for specific organization
teacher.setScheduleSlot('ORG001', 0, 0, {
  classroom: 'Room 101',
  subject: 'Mathematics'
}, scheduleSize.periodCount);

// Get schedule for specific organization
const schedule = teacher.getScheduleForOrganization('ORG001');
```

### Querying Teachers

```javascript
// Find teacher by global ID
const teacher = await Teacher.findByTeacherId(1001);

// Find all teachers in an organization
const teachers = await Teacher.findTeachersInOrganization('ORG001');

// Find active teachers in an organization
const activeTeachers = await Teacher.findActiveTeachersInOrganization('ORG001');
```

### Organization Methods

```javascript
// Get all teachers in organization
const teachers = await organisation.getAllTeachers();

// Get teacher by ID in organization
const teacher = await organisation.getTeacherById(1001);

// Get teachers by subject
const mathTeachers = await organisation.getTeachersBySubject('Mathematics');

// Check if teacher exists in organization
const exists = await organisation.hasTeacher(1001);
```

## API Endpoint Changes

The existing API endpoints will need to be updated to work with the new schema. Here are the key changes needed:

### Teacher Routes

1. **Create Teacher**: Now requires `email` field and can optionally include `phone`, `bio`, `profilePicture`
2. **Get Teacher**: Returns organization-specific data when `organisationId` is provided
3. **Update Teacher**: Can update global fields or organization-specific fields
4. **Delete Teacher**: Removes teacher from specific organization or globally

### New Endpoints Needed

1. **Add Teacher to Organization**: `POST /teachers/:teacherId/organizations`
2. **Remove Teacher from Organization**: `DELETE /teachers/:teacherId/organizations/:organisationId`
3. **Get Teacher's Organizations**: `GET /teachers/:teacherId/organizations`
4. **Update Organization Data**: `PUT /teachers/:teacherId/organizations/:organisationId`

## Benefits

1. **Multi-Organization Support**: Teachers can work across multiple institutions
2. **Individual Schedules**: Each organization has its own schedule grid
3. **Flexible Permissions**: Different permissions for each organization
4. **Scalable**: Easy to add/remove organizations
5. **Data Isolation**: Organization-specific data is properly separated
6. **Backward Compatibility**: Existing functionality is preserved with updates

## Migration Considerations

1. **Data Migration**: Existing teachers need to be migrated to the new structure
2. **API Updates**: All API endpoints need to be updated
3. **Frontend Changes**: UI needs to handle multiple organizations
4. **Testing**: Comprehensive testing of multi-organization scenarios

## Database Indexes

The new schema includes optimized indexes for:
- Global teacher ID lookup
- Email lookup
- Organization-based queries
- Subject and class-based queries
- Active status filtering

## Example Usage

See `example_multi_org_usage.js` for a complete demonstration of the new system.
