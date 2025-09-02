<!-- router/organisation/OTP_README.md -->
# Organization OTP Access System

This document describes the OTP (One-Time Password) system for teacher organization access management.

## Overview

The OTP system provides secure access control for teachers who need edit permissions in organizations. Teachers with edit access can generate OTPs to authenticate their access to organization resources.

## Database Schema Changes

### Teacher Model Updates
- Added `accessOTP` field with code, expiration, and usage tracking
- Added `permissions` object with granular access control
- Added `isActive` flag for teacher status management

### Organisation Model Updates
- Added `otpSettings` for organization-level OTP configuration
- Added `otpUsage` array for security tracking and audit logs

## API Endpoints

### 1. Generate OTP
**POST** `/api/organisation/:organisationId/otp/generate`

Generates a new OTP for a teacher with edit access.

**Request Body:**
```json
{
  "teacherId": "123",
  "requestedBy": "admin@example.com"
}
```

**Response:**
```json
{
  "message": "OTP generated successfully",
  "organisationId": "org-123",
  "teacherId": "123",
  "teacherName": "John Doe",
  "otpExpiresIn": 15,
  "generatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 2. Validate OTP
**POST** `/api/organisation/:organisationId/otp/validate`

Validates an OTP and grants access if valid.

**Request Body:**
```json
{
  "teacherId": "123",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "OTP validated successfully",
  "organisationId": "org-123",
  "teacherId": "123",
  "teacherName": "John Doe",
  "permissions": {
    "view": true,
    "edit": true,
    "delete": false,
    "manageTeachers": false,
    "manageClassrooms": false
  },
  "validatedAt": "2024-01-01T12:00:00.000Z",
  "accessGranted": true
}
```

### 3. Get OTP Status
**GET** `/api/organisation/:organisationId/otp/status/:teacherId`

Gets the current OTP status for a teacher.

**Response:**
```json
{
  "organisationId": "org-123",
  "teacherId": "123",
  "teacherName": "John Doe",
  "otpStatus": {
    "hasOTP": true,
    "isUsed": false,
    "isExpired": false,
    "expiresAt": "2024-01-01T12:15:00.000Z",
    "hasEditAccess": true,
    "permissions": { ... }
  },
  "otpSettings": {
    "enabled": true,
    "expirationMinutes": 15,
    "maxAttempts": 3
  }
}
```

### 4. Update Teacher Permissions
**PUT** `/api/organisation/:organisationId/teachers/:teacherId/permissions`

Updates teacher permissions (admin only).

**Request Body:**
```json
{
  "permissions": {
    "view": true,
    "edit": true,
    "delete": false,
    "manageTeachers": true,
    "manageClassrooms": false
  },
  "updatedBy": "admin@example.com"
}
```

### 5. Get All Teachers with Permissions
**GET** `/api/organisation/:organisationId/teachers/permissions`

Gets all teachers in an organization with their permissions.

**Response:**
```json
{
  "organisationId": "org-123",
  "organisationName": "Example School",
  "teachers": [
    {
      "id": "123",
      "name": "John Doe",
      "permissions": { ... },
      "isActive": true,
      "hasEditAccess": true,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "totalTeachers": 1,
  "teachersWithEditAccess": 1
}
```

### 6. Update OTP Settings
**PUT** `/api/organisation/:organisationId/otp/settings`

Updates organization OTP settings (admin only).

**Request Body:**
```json
{
  "otpSettings": {
    "enabled": true,
    "expirationMinutes": 30,
    "maxAttempts": 5
  },
  "updatedBy": "admin@example.com"
}
```

## Security Features

1. **OTP Expiration**: OTPs expire after 15 minutes by default (configurable)
2. **Single Use**: Each OTP can only be used once
3. **Usage Tracking**: All OTP usage is logged with IP address and user agent
4. **Permission Validation**: Only teachers with edit access can generate OTPs
5. **Organization Isolation**: OTPs are scoped to specific organizations

## Usage Flow

1. **Teacher Registration**: Teacher is created with default permissions (view only)
2. **Permission Grant**: Admin grants edit permissions to teacher
3. **OTP Generation**: Teacher with edit access generates OTP
4. **OTP Validation**: Teacher uses OTP to authenticate access
5. **Access Granted**: Teacher can now perform edit operations

## Error Handling

The system provides comprehensive error handling for:
- Invalid organization IDs
- Non-existent teachers
- Expired OTPs
- Used OTPs
- Invalid OTP codes
- Insufficient permissions
- Disabled OTP systems

## Frontend Integration

The frontend can integrate with this system by:
1. Checking teacher permissions before showing edit options
2. Generating OTPs when teachers need edit access
3. Validating OTPs before allowing edit operations
4. Displaying OTP status and expiration times
5. Managing teacher permissions through admin interface

## Configuration

OTP settings can be configured per organization:
- **enabled**: Enable/disable OTP system
- **expirationMinutes**: OTP expiration time (default: 15 minutes)
- **maxAttempts**: Maximum validation attempts (default: 3)

## Audit Trail

All OTP operations are logged with:
- Teacher ID and name
- Organization ID
- Timestamp
- IP address
- User agent
- Operation type (generate/validate)
