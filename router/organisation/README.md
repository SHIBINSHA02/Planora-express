# Organisation Router Structure

This directory contains the modular organisation router split from the original large `Organisation.js` file.

## File Structure

```
router/organisation/
├── index.js              # Main router that combines all modules
├── organisationRoutes.js # Basic CRUD operations for organisations
├── teacherRoutes.js      # Teacher management within organisations
├── classroomRoutes.js    # Classroom management operations
├── gridRoutes.js         # Grid/schedule cell operations
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
- `POST /` - Create new classroom
- `GET /:organisationId/classroom/:classroomId` - Get classroom
- `PUT /:organisationId/classroom/:classroomId` - Update classroom

### 4. gridRoutes.js
Manages schedule grid operations:
- `PATCH /:organisationId/classroom/:classroomId/grid/:row/:col` - Update grid cell

## Usage

The main `index.js` file combines all route modules and can be imported in your main server file:

```javascript
const organisationRouter = require('./router/organisation');
app.use('/api/organisation', organisationRouter);
```

## Benefits of This Structure

1. **Maintainability**: Each file has a single responsibility
2. **Readability**: Easier to find and modify specific functionality
3. **Scalability**: New route types can be added as separate modules
4. **Testing**: Individual modules can be tested in isolation
5. **Collaboration**: Multiple developers can work on different modules simultaneously
