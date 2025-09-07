<!-- router/Readme.md -->
# Router Documentation

This document provides comprehensive information about the router structure and recent updates made to the Planora Express application.

## Overview

The router system has been modularized to provide better organization, maintainability, and scalability. The main router structure includes organization management, teacher management, classroom operations, grid/schedule management, and comprehensive access control.

## Router Structure

### Main Router Files
- `index.js` - Main router entry point
- `authRoutes.js` - Authentication routes
- `organisationRoutes.js` - Basic organization CRUD operations
- `teacherRoutes.js` - Teacher management routes
- `userRoutes.js` - User management routes

### Organization Router Module (`/organisation/`)
The organization router has been split into modular components for better maintainability:

#### Files:
- `index.js` - Combines all organization-related routes
- `organisationRoutes.js` - Basic CRUD operations for organizations
- `teacherRoutes.js` - Teacher management within organizations
- `classroomRoutes.js` - Classroom management operations
- `gridRoutes.js` - Grid/schedule cell operations
- `accessRoutes.js` - Permission and access control management

## Recent Changes Made

### Route Path Updates
- Changed `GET /:classroomId` to `GET /organisation/:organisationId/classroom/:classroomId`
- Changed `PATCH /:classroomId/grid/:row/:col` to `PATCH /organisation/:organisationId/classroom/:classroomId/grid/:row/:col`
- Changed `PUT /:classroomId` to `PUT /organisation/:organisationId/classroom/:classroomId`
- Added `GET /organisation/:organisationId/teachers/:teacherId/schedule` for computed teacher schedules
- These changes ensure routes reflect both `organisationId` and `classroomId` as required

### Schema Updates
- **Classrooms**: Changed from single object to array structure to support multiple classrooms per organisation
- **Grid Structure**: Updated from 2D array to flattened array (5 days × 6 periods = 30 cells total)
- **Teacher Schedules**: Removed stored schedule field - schedules are now computed from classroom grids
- **Grid Cells**: Each cell now contains `teachers` array and `subjects` array

### Query Updates
- Updated queries to work with classrooms array structure
- Grid operations now use flattened indexing (row × periodCount + col)
- Teacher schedule computation aggregates from all classroom grids

### Error Messages
- Updated error messages to reflect that both organisation and classroom need to be found (e.g., "Classroom or Organisation not found")

### POST Route
- Left unchanged since it already accepts `organisationId` and `classroomId` in the request body and creates the organisation with the nested classroom structure correctly

### Validation and Logic
- Ensured all operations (GET, PATCH, PUT) respect the nested schema structure by accessing fields like `organisation.classrooms`
- Maintained validation for grid indices and input fields, ensuring compatibility with the schema's `periodCount` and `daysCount` fields at the organization level
- Kept the populate calls to fetch related teacher data for `assignedTeacher`, `assignedTeachers`, and `grid.teachers`

## New Access Control Features

### Permission Management Routes
The new `accessRoutes.js` provides comprehensive permission management:

#### Individual Permission Operations:
- `GET /:organisationId/teachers/:teacherId/permissions` - Get teacher permissions
- `PUT /:organisationId/teachers/:teacherId/permissions` - Update teacher permissions
- `PATCH /:organisationId/teachers/:teacherId/permissions/:permissionType` - Update specific permission
- `GET /:organisationId/teachers/:teacherId/has-permission/:permissionType` - Check specific permission

#### Bulk Operations:
- `POST /:organisationId/teachers/bulk-permissions` - Bulk update permissions for multiple teachers
- `GET /:organisationId/teachers/with-permission/:permissionType` - Get all teachers with specific permission
- `GET /:organisationId/permissions/summary` - Get permission summary for organization

### Permission Types
The system supports the following permission types:
- `view` - Can view organisation data
- `edit` - Can edit organisation data
- `delete` - Can delete organisation data
- `manageTeachers` - Can manage teachers within organisation
- `manageClassrooms` - Can manage classrooms within organisation

## Route Examples

### Teacher Management
```javascript
// Register a new teacher
POST /api/organisation/org123/teachers
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "subjects": ["Math", "Science"],
  "classes": ["Class A", "Class B"],
  "permissions": {
    "view": true,
    "edit": false,
    "delete": false,
    "manageTeachers": false,
    "manageClassrooms": false
  }
}

// Get all teachers in organisation
GET /api/organisation/org123/teachers

// Update teacher permissions
PUT /api/organisation/org123/teachers/1/permissions
{
  "permissions": {
    "view": true,
    "edit": true,
    "delete": false,
    "manageTeachers": false,
    "manageClassrooms": false
  }
}
```

### Classroom Management
```javascript
// Create a new classroom
POST /api/organisation/
{
  "organisationId": "org123",
  "classroomId": "class1",
  "classroomName": "Grade 10 Mathematics",
  "assignedTeacher": "teacher_object_id",
  "assignedTeachers": ["teacher_object_id1", "teacher_object_id2"],
  "assignedSubjects": ["Math", "Science"]
}

// Get classroom details
GET /api/organisation/org123/classroom/class1

// Update classroom
PUT /api/organisation/org123/classroom/class1
{
  "classroomName": "Grade 10 Advanced Mathematics",
  "assignedTeacher": "teacher_object_id2",
  "assignedTeachers": ["teacher_object_id2", "teacher_object_id3"],
  "assignedSubjects": ["Math", "Physics"]
}

// Update grid cell (flattened structure: 5 days × 6 periods = 30 cells)
PATCH /api/organisation/org123/classroom/class1/grid/0/0
{
  "teachers": ["teacher_object_id1"],
  "subjects": ["Math"]
}

// Get teacher's computed schedule
GET /api/organisation/org123/teachers/1001/schedule
```

### Access Control
```javascript
// Check if teacher has edit permission
GET /api/organisation/org123/teachers/1/has-permission/edit

// Get all teachers with edit permission
GET /api/organisation/org123/teachers/with-permission/edit

// Bulk update permissions
POST /api/organisation/org123/teachers/bulk-permissions
{
  "teacherUpdates": [
    {
      "teacherId": 1,
      "permissions": {
        "view": true,
        "edit": true,
        "delete": false,
        "manageTeachers": false,
        "manageClassrooms": false
      }
    }
  ]
}
```

## Benefits of the New Structure

1. **Maintainability**: Each file has a single responsibility
2. **Readability**: Easier to find and modify specific functionality
3. **Scalability**: New route types can be added as separate modules
4. **Testing**: Individual modules can be tested in isolation
5. **Collaboration**: Multiple developers can work on different modules simultaneously
6. **Security**: Comprehensive permission system for access control
7. **Flexibility**: Support for both individual and bulk operations

## Usage

The main router can be imported and used in your server file:

```javascript
const organisationRouter = require('./router/organisation');
app.use('/api/organisation', organisationRouter);
```

These changes align the router with the requirement to use both `organisationId` and `classroomId` in the routes while maintaining full compatibility with the provided OrganisationSchema and adding comprehensive access control features.