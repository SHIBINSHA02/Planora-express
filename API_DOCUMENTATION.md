<!-- API_DOCUMENTATION.md -->
## Multi-Organization Teacher System API

Base URL: `http://localhost:3000/api`

### Health and Utilities
- GET `/` → Welcome message
- GET `/health` → Health check
- GET `/seed` → Seed minimum demo data (query: `?force=true`)

### Auth
- POST `/register` → Register user
- POST `/login` → Login user

### Users
- GET `/users` → List users
- GET `/users/:userId` → Get user
- PUT `/users/:userId` → Update user

### Organisation Access (per user)
- POST `/users/:userId/organization-access` → Grant access
- DELETE `/users/:userId/organization-access/:organisationId` → Revoke access
- GET `/users/:userId/organizations` → List accessible organisations
- POST `/check-access` → Check access for a user and organisation

### Teacher linking (user ↔ teacher)
- POST `/users/:userId/link-teacher` → Link user to existing teacher by `teacherId`
- GET `/users/:userId/teacher` → Get linked teacher profile
- DELETE `/users/:userId/unlink-teacher` → Unlink teacher from user
- GET `/users/:userId/teacher-organizations` → Organisations where the user has access and teacher is a member
- POST `/users/:userId/create-teacher` → Create teacher profile for user
- POST `/users/create-or-link-teacher` → Unified: upsert user and create/link teacher

Request body example for unified endpoint:
```json
{
  "userId": "optional",
  "username": "optional",
  "email": "user@example.com",
  "password": "required if creating user",
  "firstName": "Required if creating user",
  "lastName": "Required if creating user",
  "teacher": {
    "id": 12345,
    "name": "Jane Doe",
    "email": "jane.teacher@example.com",
    "phone": "",
    "bio": "",
    "profilePicture": "",
    "globalPermissions": { "view": true, "edit": false }
  }
}
```

### Organisation router (mounted at `/api/organisation`)

Organisation CRUD
- GET `/organisation/list` → List organisations
- GET `/organisation/:organisationId` → Get organisation
- POST `/organisation/create` → Create organisation
- PUT `/organisation/:organisationId` → Update organisation
- DELETE `/organisation/:organisationId` → Delete organisation
- GET `/organisation/:organisationId/stats` → Organisation stats

Organisation teachers
- POST `/organisation/:organisationId/teachers` → Register teacher in organisation
- GET `/organisation/:organisationId/teachers` → List teachers
- GET `/organisation/:organisationId/teachers/:teacherId` → Get teacher
- PUT `/organisation/:organisationId/teachers/:teacherId` → Update teacher
- DELETE `/organisation/:organisationId/teachers/:teacherId` → Remove teacher
- GET `/organisation/:organisationId/teachers/subject/:subject` → Teachers by subject
- GET `/organisation/:organisationId/teachers/class/:className` → Teachers by class
- GET `/organisation/:organisationId/teachers/active` → Active teachers
- GET `/organisation/:organisationId/teachers/count` → Teacher count
- GET `/organisation/:organisationId/teachers/:teacherId/schedule` → Get teacher's computed schedule

Organisation classrooms and grid
- POST `/organisation/` → Create classroom (requires organisation and classroom payload)
- GET `/organisation/:organisationId/classroom/:classroomId` → Get classroom
- PUT `/organisation/:organisationId/classroom/:classroomId` → Update classroom
- PATCH `/organisation/:organisationId/classroom/:classroomId/grid/:row/:col` → Update grid cell

**Note**: Grid structure is now flattened (5 days × 6 periods = 30 cells total). Each cell contains:
- `teachers`: Array of teacher ObjectIds assigned to this time slot
- `subjects`: Array of subjects taught in this time slot

Organisation permissions
- GET `/organisation/:organisationId/teachers/:teacherId/permissions` → Get permissions
- PUT `/organisation/:organisationId/teachers/:teacherId/permissions` → Update permissions
- PATCH `/organisation/:organisationId/teachers/:teacherId/permissions/:permissionType` → Update specific permission
- GET `/organisation/:organisationId/teachers/with-permission/:permissionType` → Teachers with permission
- GET `/organisation/:organisationId/permissions/summary` → Permission summary
- POST `/organisation/:organisationId/teachers/bulk-permissions` → Bulk update permissions
- GET `/organisation/:organisationId/teachers/:teacherId/has-permission/:permissionType` → Check a permission

### Responses and Errors
- Success: `200 OK` (or `201 Created` for new resources)
- Client errors: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- Server errors: `500 Internal Server Error`

Error JSON shape:
```json
{ "message": "Error description", "error": "Detailed error message" }
```
