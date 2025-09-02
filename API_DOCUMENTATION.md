# Multi-Organization Teacher System API Documentation

## Overview

This API supports a multi-organization teacher system where teachers can belong to multiple organizations with individual schedules, subjects, and permissions for each organization.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require proper authentication. Include user credentials in headers or use the Auth endpoints to get access tokens.

---

## Teacher Endpoints (`/teachers`)

### Global Teacher Management

#### GET `/teachers`
Get all teachers (optionally filter by organization)

**Query Parameters:**
- `organisationId` (optional): Filter teachers by organization

**Response:**
```json
{
  "organisation": "ORG001" | "all",
  "teachers": [
    {
      "id": 1001,
      "name": "Dr. John Smith",
      "email": "john.smith@example.com",
      "phone": "+1234567890",
      "bio": "Experienced educator",
      "profilePicture": "https://example.com/photo.jpg",
      "globalPermissions": { "view": true, "edit": true },
      "isActive": true,
      "organizations": [...]
    }
  ]
}
```

#### GET `/teachers/:id`
Get teacher by ID

**Query Parameters:**
- `organisationId` (optional): Get organization-specific data

**Response:**
```json
{
  "teacher": {
    "id": 1001,
    "name": "Dr. John Smith",
    "email": "john.smith@example.com",
    "phone": "+1234567890",
    "bio": "Experienced educator",
    "profilePicture": "https://example.com/photo.jpg",
    "globalPermissions": { "view": true, "edit": true },
    "isActive": true,
    "organizations": [...]
  },
  "organisation": "ORG001",
  "organizationData": {
    "organisationId": "ORG001",
    "subjects": ["Mathematics", "Physics"],
    "classes": ["Grade 10", "Grade 11"],
    "permissions": { "view": true, "edit": true },
    "isActive": true,
    "joinedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/teachers`
Create a new teacher

**Request Body:**
```json
{
  "id": 1001,
  "name": "Dr. John Smith",
  "email": "john.smith@example.com",
  "phone": "+1234567890",
  "bio": "Experienced educator",
  "profilePicture": "https://example.com/photo.jpg",
  "globalPermissions": { "view": true, "edit": false }
}
```

#### PUT `/teachers/:id`
Update teacher global information

**Request Body:**
```json
{
  "name": "Dr. John Smith Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567891",
  "bio": "Updated bio",
  "profilePicture": "https://example.com/new-photo.jpg",
  "globalPermissions": { "view": true, "edit": true },
  "isActive": true
}
```

#### DELETE `/teachers/:id`
Delete teacher globally (removes from all organizations)

---

### Multi-Organization Teacher Management

#### POST `/teachers/:id/organizations`
Add teacher to an organization

**Request Body:**
```json
{
  "organisationId": "ORG001",
  "subjects": ["Mathematics", "Physics"],
  "classes": ["Grade 10", "Grade 11"],
  "permissions": {
    "view": true,
    "edit": true,
    "delete": false,
    "manageTeachers": false,
    "manageClassrooms": true
  }
}
```

#### DELETE `/teachers/:id/organizations/:organisationId`
Remove teacher from an organization

#### GET `/teachers/:id/organizations`
Get all organizations the teacher belongs to

**Response:**
```json
{
  "teacherId": 1001,
  "organizations": [
    {
      "organisationId": "ORG001",
      "subjects": ["Mathematics", "Physics"],
      "classes": ["Grade 10", "Grade 11"],
      "permissions": { "view": true, "edit": true },
      "isActive": true,
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### PUT `/teachers/:id/organizations/:organisationId`
Update teacher's organization-specific data

**Request Body:**
```json
{
  "subjects": ["Mathematics", "Physics", "Chemistry"],
  "classes": ["Grade 10", "Grade 11", "Grade 12"],
  "permissions": {
    "view": true,
    "edit": true,
    "delete": false,
    "manageTeachers": true,
    "manageClassrooms": true
  },
  "isActive": true
}
```

---

### Schedule Management

#### GET `/teachers/:id/schedule/:organisationId`
Get teacher's schedule for specific organization

**Response:**
```json
{
  "teacherId": 1001,
  "organisationId": "ORG001",
  "schedule": [
    {
      "classroom": "Room 101",
      "subject": "Mathematics"
    },
    {
      "classroom": null,
      "subject": null
    }
  ],
  "scheduleSize": {
    "daysCount": 5,
    "periodCount": 6,
    "totalSlots": 30
  }
}
```

#### PUT `/teachers/:id/schedule/:organisationId`
Update teacher's schedule for specific organization

**Request Body:**
```json
{
  "schedule": [
    {
      "classroom": "Room 101",
      "subject": "Mathematics"
    },
    {
      "classroom": "Lab A",
      "subject": "Physics"
    }
  ]
}
```

---

## Organization Teacher Endpoints (`/organisations/:organisationId/teachers`)

### Organization-Specific Teacher Management

#### POST `/organisations/:organisationId/teachers`
Register a new teacher within an organization

**Request Body:**
```json
{
  "id": 1001,
  "name": "Dr. John Smith",
  "email": "john.smith@example.com",
  "phone": "+1234567890",
  "bio": "Experienced educator",
  "profilePicture": "https://example.com/photo.jpg",
  "subjects": ["Mathematics", "Physics"],
  "classes": ["Grade 10", "Grade 11"],
  "permissions": {
    "view": true,
    "edit": false,
    "delete": false,
    "manageTeachers": false,
    "manageClassrooms": false
  }
}
```

#### GET `/organisations/:organisationId/teachers`
Get all teachers in an organization

#### GET `/organisations/:organisationId/teachers/:teacherId`
Get specific teacher in an organization

#### PUT `/organisations/:organisationId/teachers/:teacherId`
Update teacher in an organization

#### DELETE `/organisations/:organisationId/teachers/:teacherId`
Remove teacher from an organization

---

### Organization-Specific Queries

#### GET `/organisations/:organisationId/teachers/subject/:subject`
Get teachers by subject in an organization

#### GET `/organisations/:organisationId/teachers/class/:className`
Get teachers by class in an organization

#### GET `/organisations/:organisationId/teachers/active`
Get active teachers in an organization

#### GET `/organisations/:organisationId/teachers/count`
Get teacher count in an organization

---

## Authentication Endpoints (`/auth`)

### User Management

#### POST `/auth/register`
Register a new user

#### POST `/auth/login`
Login user

#### GET `/auth/users`
Get all users (admin only)

#### GET `/auth/users/:userId`
Get user by ID

#### PUT `/auth/users/:userId`
Update user

---

### Organization Access Management

#### POST `/auth/users/:userId/organization-access`
Grant organization access to user

#### DELETE `/auth/users/:userId/organization-access/:organisationId`
Revoke organization access from user

#### GET `/auth/users/:userId/organizations`
Get user's accessible organizations

#### POST `/auth/check-access`
Check if user has access to organization

---

### Teacher-Auth Integration

#### POST `/auth/users/:userId/link-teacher`
Link user to existing teacher profile

**Request Body:**
```json
{
  "teacherId": 1001
}
```

#### GET `/auth/users/:userId/teacher`
Get user's linked teacher profile

#### DELETE `/auth/users/:userId/unlink-teacher`
Unlink user from teacher profile

#### GET `/auth/users/:userId/teacher-organizations`
Get user's teacher organizations with access

#### POST `/auth/users/:userId/create-teacher`
Create teacher profile for user

**Request Body:**
```json
{
  "id": 1001,
  "name": "Dr. John Smith",
  "email": "john.smith@example.com",
  "phone": "+1234567890",
  "bio": "Experienced educator",
  "profilePicture": "https://example.com/photo.jpg",
  "globalPermissions": { "view": true, "edit": false }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

---

## Usage Examples

### 1. Create a Teacher and Add to Multiple Organizations

```javascript
// 1. Create teacher
const teacher = await fetch('/api/teachers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1001,
    name: 'Dr. John Smith',
    email: 'john.smith@example.com',
    phone: '+1234567890',
    bio: 'Experienced educator'
  })
});

// 2. Add to first organization
await fetch('/api/teachers/1001/organizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organisationId: 'ORG001',
    subjects: ['Mathematics', 'Physics'],
    classes: ['Grade 10', 'Grade 11'],
    permissions: { view: true, edit: true }
  })
});

// 3. Add to second organization
await fetch('/api/teachers/1001/organizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organisationId: 'ORG002',
    subjects: ['Advanced Physics', 'Chemistry'],
    classes: ['Year 1', 'Year 2'],
    permissions: { view: true, edit: false }
  })
});
```

### 2. Get Teacher's Schedule for Specific Organization

```javascript
const schedule = await fetch('/api/teachers/1001/schedule/ORG001');
const scheduleData = await schedule.json();

console.log(`Schedule for ${scheduleData.organisationId}:`);
scheduleData.schedule.forEach((slot, index) => {
  console.log(`Slot ${index}: ${slot.classroom || 'Unassigned'} - ${slot.subject || 'Free'}`);
});
```

### 3. Link User to Teacher Profile

```javascript
// Link existing user to teacher
await fetch('/api/auth/users/user-123/link-teacher', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teacherId: 1001
  })
});

// Get user's teacher profile
const teacherProfile = await fetch('/api/auth/users/user-123/teacher');
const profile = await teacherProfile.json();
```

---

## Database Schema Changes

### Teacher Schema
- Added `linkedUserId` field to link with Auth users
- Changed from single organization to multiple organizations array
- Each organization membership includes subjects, classes, schedule, and permissions

### Auth Schema
- Existing organization access system remains unchanged
- New endpoints for teacher integration

### Organization Schema
- Updated methods to work with new teacher structure
- Maintains backward compatibility

---

## Migration Notes

1. **Existing Data**: Existing teachers need to be migrated to the new structure
2. **API Compatibility**: Some endpoints have changed - update client code accordingly
3. **New Features**: Multi-organization support and teacher-auth linking are new features
4. **Testing**: Test all endpoints thoroughly before production deployment
