# Seed Data Documentation

## Overview
The seed data system generates comprehensive test data for the Planora Express application, ensuring every grid cell has at least 1 teacher and 1 subject assigned.

## Data Structure

### Organizations
- **Count**: 10 organizations (org-1 to org-10)
- **Structure**: Each organization has:
  - `organisationId`: Unique identifier (e.g., "org-1")
  - `name`: Organization name (e.g., "Organisation 1")
  - `admin`: Admin identifier (e.g., "admin-1")
  - `periodCount`: 6 periods per day
  - `daysCount`: 5 days per week
  - `classrooms`: Array of classroom objects

### Classrooms
- **Count**: 1 classroom per organization (10 total)
- **Structure**: Each classroom has:
  - `classroomId`: Unique identifier (e.g., "cls-1")
  - `classroomName`: Classroom name (e.g., "Classroom 1")
  - `assignedTeacher`: Primary teacher (ObjectId)
  - `assignedTeachers`: Array of teacher ObjectIds (up to 5)
  - `assignedSubjects`: Array of subjects (4 random subjects)
  - `grid`: Flattened array of 30 cells (5 days × 6 periods)

### Grid Structure
- **Total Cells**: 30 cells per classroom (5 days × 6 periods)
- **Cell Index**: Flattened structure where cell index = (day × 6) + period
- **Cell Content**: Each cell contains:
  - `teachers`: Array of teacher ObjectIds (minimum 1)
  - `subjects`: Array of subjects (minimum 1)

### Teachers
- **Count**: 10 teachers (ID: 1000-1009)
- **Structure**: Each teacher has:
  - `id`: Unique numeric ID
  - `name`: Full name (e.g., "Alice Anderson")
  - `email`: Email address (e.g., "alice.anderson@example.com")
  - `phone`: Phone number
  - `bio`: Teaching specialization
  - `globalPermissions`: View/edit permissions
  - `organizations`: Array of organization memberships
  - `linkedUserId`: Associated user ID (first 10 teachers)

### Users
- **Count**: 15 users total
- **Structure**: Each user has:
  - `userId`: Unique identifier
  - `username`: Username
  - `email`: Email address
  - `password`: "password123" (plain text for demo)
  - `firstName` & `lastName`: User names
  - `organizationAccess`: Array of organization access permissions

## Subject and Class Pools

### Subjects (10 total)
- Math, Science, History, English, Art, Music, PE, Geography, CS, Economics

### Classes (5 total)
- Class A, Class B, Class C, Class D, Class E

## Data Generation Process

### 1. Organization Creation
```javascript
// Each organization gets:
- 4 random subjects from the subject pool
- 1 classroom with 30 grid cells
- Every grid cell gets 1 random subject
```

### 2. Teacher Assignment
```javascript
// Each teacher:
- Joins 1-2 random organizations
- Gets 2-3 random subjects
- Gets 2 random classes
- Gets random permissions
```

### 3. Grid Population
```javascript
// Grid cells are populated by:
1. Assigning teachers to cells where subjects match
2. Ensuring every cell has at least 1 teacher
3. If no matching teacher found, assign any teacher from the organization
```

### 4. User Linking
```javascript
// User-teacher linking:
- First 10 users are linked to first 10 teachers
- Remaining 5 users are standalone (not teachers)
- Each user gets access to 2 random organizations
```

## API Endpoints for Seed Data

### Generate Seed Data
```bash
GET /api/seed
GET /api/seed?force=true  # Clear existing data first
```

### Response
```json
{
  "message": "Seeding completed",
  "forceCleared": false,
  "counts": {
    "organisations": 10,
    "teachers": 10,
    "users": 15,
    "linkedTeachers": 10,
    "regularUsers": 5
  }
}
```

## Validation Rules

### Grid Validation
- ✅ Every grid cell has at least 1 subject
- ✅ Every grid cell has at least 1 teacher
- ✅ Grid size matches organization settings (5 × 6 = 30 cells)
- ✅ Teachers are assigned to cells where they teach matching subjects

### Data Integrity
- ✅ All teachers belong to at least 1 organization
- ✅ All classrooms have valid grid structures
- ✅ All users have organization access
- ✅ Teacher-user linking is consistent

## Example Grid Cell
```json
{
  "teachers": ["507f1f77bcf86cd799439011"],
  "subjects": ["Math"]
}
```

## Example Teacher Schedule Response
```json
{
  "organisation": "org-1",
  "teacher": {
    "id": 1001,
    "name": "Bob Brown",
    "email": "bob.brown@example.com"
  },
  "schedule": [
    {
      "classroom": "cls-1",
      "subjects": ["Math"]
    },
    null,
    {
      "classroom": "cls-1", 
      "subjects": ["Science"]
    }
    // ... 27 more cells
  ],
  "daysCount": 5,
  "periodCount": 6,
  "totalSlots": 30
}
```

## Notes
- All data is generated with realistic but random values
- Grid cells are indexed from 0-29 (flattened structure)
- Teacher schedules are computed dynamically from classroom grids
- Seed data can be regenerated with `?force=true` parameter
