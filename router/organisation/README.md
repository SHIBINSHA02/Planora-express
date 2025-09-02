<!-- router/organisation/README.md -->
# Organisation Router Structure

This directory contains the modular organisation router split from the original large `Organisation.js` file. The router provides comprehensive management of organizations, teachers, classrooms, schedules, and access permissions.

## File Structure

```
router/organisation/
├── index.js              # Main router that combines all modules
├── organisationRoutes.js # Basic CRUD operations for organisations
├── teacherRoutes.js      # Teacher management within organisations
├── classroomRoutes.js    # Classroom management operations
├── gridRoutes.js         # Grid/schedule cell operations
├── accessRoutes.js       # Permission and access control management
└── README.md            # This documentation file
```

## Route Modules

### 1. organisationRoutes.js
Handles basic organisation CRUD operations:
- `GET /list` - Get all organizations
- `GET /:organisationId` - Get specific organization
- `POST /create` - Create new organization
- `PUT /:organisationId` - Update organization
- `DELETE /:organisationId` - Delete organization

### 2. teacherRoutes.js
Manages teachers within organizations:
- `POST /:organisationId/teachers` - Register new teacher
- `GET /:organisationId/teachers` - Get all teachers
- `GET /:organisationId/teachers/:teacherId` - Get specific teacher
- `PUT /:organisationId/teachers/:teacherId` - Update teacher
- `DELETE /:organisationId/teachers/:teacherId` - Remove teacher

### 3. classroomRoutes.js
Handles classroom operations:
- `POST /` - Create new classroom (requires classroomId and classroomName)
- `GET /:organisationId/classroom/:classroomId` - Get classroom
- `PUT /:organisationId/classroom/:classroomId` - Update classroom (includes classroomName)

### 4. gridRoutes.js
Manages schedule grid operations:
- `PATCH /:organisationId/classroom/:classroomId/grid/:row/:col` - Update grid cell

### 5. accessRoutes.js
Handles permission and access control management:
- `GET /:organisationId/teachers/:teacherId/permissions` - Get teacher permissions
- `PUT /:organisationId/teachers/:teacherId/permissions` - Update teacher permissions
- `PATCH /:organisationId/teachers/:teacherId/permissions/:permissionType` - Update specific permission
- `GET /:organisationId/teachers/with-permission/:permissionType` - Get teachers with specific permission
- `GET /:organisationId/permissions/summary` - Get permission summary for organisation
- `POST /:organisationId/teachers/bulk-permissions` - Bulk update permissions
- `GET /:organisationId/teachers/:teacherId/has-permission/:permissionType` - Check specific permission

## Permission Types

The system supports the following permission types:
- `view` - Can view organisation data
- `edit` - Can edit organisation data
- `delete` - Can delete organisation data
- `manageTeachers` - Can manage teachers within organisation
- `manageClassrooms` - Can manage classrooms within organisation

## Usage

The main `index.js` file combines all route modules and can be imported in your main server file:

```javascript
const organisationRouter = require('./router/organisation');
app.use('/api/organisation', organisationRouter);
```

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
  "name": "Classroom A",
  "admin": "admin@example.com",
  "classroomId": "class1",
  "classroomName": "Grade 10 Mathematics",
  "assignedTeacher": 1,
  "assignedTeachers": [1, 2],
  "assignedSubjects": ["Math", "Science"],
  "grid": [...],
  "periodCount": 8,
  "daysCount": 5
}

// Get classroom details
GET /api/organisation/org123/classroom/class1

// Update classroom
PUT /api/organisation/org123/classroom/class1
{
  "assignedTeacher": 2,
  "assignedTeachers": [2, 3],
  "assignedSubjects": ["Math", "Physics"],
  "grid": [...]
}
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
    },
    {
      "teacherId": 2,
      "permissions": {
        "view": true,
        "edit": false,
        "delete": false,
        "manageTeachers": true,
        "manageClassrooms": false
      }
    }
  ]
}
```

## Benefits of This Structure

1. **Maintainability**: Each file has a single responsibility
2. **Readability**: Easier to find and modify specific functionality
3. **Scalability**: New route types can be added as separate modules
4. **Testing**: Individual modules can be tested in isolation
5. **Collaboration**: Multiple developers can work on different modules simultaneously
6. **Security**: Comprehensive permission system for access control
7. **Flexibility**: Support for both individual and bulk operations
