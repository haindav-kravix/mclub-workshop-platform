# 🔌 API Reference Guide

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

## 🔑 Authentication Endpoints

### Verify Google Token
```http
POST /auth/verify-token

Body:
{
  "token": "google_credential_token"
}

Response (200):
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@email.com",
    "profilePhoto": "url",
    "isAdmin": false
  }
}
```

### Get User Profile
```http
GET /auth/profile
Authorization: Bearer {token}

Response (200):
{
  "_id": "user_id",
  "googleId": "google_id",
  "email": "user@email.com",
  "name": "User Name",
  "profilePhoto": "url",
  "isAdmin": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Update User Profile
```http
PUT /auth/profile
Authorization: Bearer {token}

Body:
{
  "name": "New Name",
  "email": "new@email.com"
}

Response (200):
Updated user object
```

## 📚 Workshop Endpoints

### Get All Workshops
```http
GET /workshops

Response (200):
[
  {
    "_id": "workshop_id",
    "title": "MongoDB Aggregation",
    "description": "Learn aggregation pipeline",
    "coverImage": "/uploads/image.jpg",
    "date": "2024-02-15T00:00:00Z",
    "time": "14:00",
    "venue": "Room 101",
    "capacity": 50,
    "duration": "2 hours",
    "registrationCount": 25,
    "isActive": true,
    "createdAt": "2024-01-10T00:00:00Z"
  }
]
```

### Get Workshop by ID
```http
GET /workshops/:id

Response (200):
{
  "_id": "workshop_id",
  "title": "Workshop Title",
  "description": "Full description",
  "coverImage": "/uploads/image.jpg",
  "date": "2024-02-15T00:00:00Z",
  "time": "14:00",
  "venue": "Location",
  "capacity": 50,
  "duration": "2 hours",
  "registrationFormFields": [
    {
      "fieldId": "field_1234567890",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "order": 0
    }
  ],
  "registrationCount": 25,
  "createdBy": {
    "_id": "admin_id",
    "name": "Admin Name",
    "email": "admin@email.com"
  },
  "createdAt": "2024-01-10T00:00:00Z"
}
```

### Create Workshop (Admin Only)
```http
POST /workshops
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
{
  "title": "Workshop Title",
  "description": "Workshop description",
  "date": "2024-02-15",
  "time": "14:00",
  "venue": "Room 101",
  "duration": "2 hours",
  "capacity": 50,
  "coverImage": [file],
  "registrationFormFields": [
    {
      "fieldId": "field_123",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "order": 0
    }
  ]
}

Response (201):
{
  "success": true,
  "workshop": { workshop object }
}
```

### Update Workshop (Admin Only)
```http
PUT /workshops/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data: Same as create (all fields optional except title)

Response (200):
{
  "success": true,
  "workshop": { updated workshop object }
}
```

### Delete Workshop (Admin Only)
```http
DELETE /workshops/:id
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Workshop deleted successfully"
}
```

### Get Admin's Workshops
```http
GET /workshops/admin/my-workshops
Authorization: Bearer {token}

Response (200):
[
  { workshop objects }
]
```

### Toggle Workshop Status (Admin Only)
```http
PATCH /workshops/:id/toggle
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "workshop": { updated workshop object }
}
```

## 📋 Registration Endpoints

### Register for Workshop
```http
POST /registrations
Authorization: Bearer {token}

Body:
{
  "workshopId": "workshop_id",
  "formData": {
    "field_1": "value_1",
    "field_2": "value_2"
  }
}

Response (201):
{
  "success": true,
  "message": "Registration successful",
  "registration": {
    "_id": "registration_id",
    "workshopId": "workshop_id",
    "userId": "user_id",
    "formData": { submitted data },
    "status": "confirmed",
    "createdAt": "2024-01-15T00:00:00Z"
  }
}
```

### Get User's Registrations
```http
GET /registrations/my-registrations
Authorization: Bearer {token}

Response (200):
[
  {
    "_id": "registration_id",
    "workshopId": {
      "_id": "workshop_id",
      "title": "Workshop Title",
      "date": "2024-02-15T00:00:00Z",
      "time": "14:00",
      "venue": "Location"
    },
    "userId": "user_id",
    "formData": { submitted data },
    "status": "confirmed",
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

### Get Workshop Registrations (Admin Only)
```http
GET /registrations/workshop/:workshopId
Authorization: Bearer {token}

Response (200):
[
  {
    "_id": "registration_id",
    "workshopId": "workshop_id",
    "userId": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@email.com",
      "profilePhoto": "url"
    },
    "formData": { submitted data },
    "status": "confirmed",
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

### Cancel Registration
```http
DELETE /registrations/:registrationId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Registration cancelled"
}
```

### Delete Registration (Admin Only)
```http
DELETE /registrations/admin/:registrationId
Authorization: Bearer {token}

Body:
{
  "workshopId": "workshop_id"
}

Response (200):
{
  "success": true,
  "message": "Registration deleted"
}
```

### Export Registrations to Excel (Admin Only)
```http
GET /registrations/workshop/:workshopId/export
Authorization: Bearer {token}

Response (200):
Binary file (.xlsx)
```

## 🆘 Error Responses

### 400 Bad Request
```json
{
  "message": "Error description"
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Workshop not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details (development only)"
}
```

## 📊 Field Types

When creating registration form fields:

### Text Field
```javascript
{
  "fieldId": "unique_id",
  "label": "Full Name",
  "type": "text",
  "required": true,
  "options": [],
  "order": 0
}
```

### Email Field
```javascript
{
  "fieldId": "unique_id",
  "label": "Email",
  "type": "email",
  "required": true,
  "options": [],
  "order": 1
}
```

### Phone Field
```javascript
{
  "fieldId": "unique_id",
  "label": "Phone",
  "type": "phone",
  "required": true,
  "options": [],
  "order": 2
}
```

### Textarea Field
```javascript
{
  "fieldId": "unique_id",
  "label": "Comments",
  "type": "textarea",
  "required": false,
  "options": [],
  "order": 3
}
```

### Dropdown Field
```javascript
{
  "fieldId": "unique_id",
  "label": "Experience Level",
  "type": "select",
  "required": true,
  "options": ["Beginner", "Intermediate", "Advanced"],
  "order": 4
}
```

### Radio Button Field
```javascript
{
  "fieldId": "unique_id",
  "label": "Attending In Person?",
  "type": "radio",
  "required": true,
  "options": ["Yes", "No", "Maybe"],
  "order": 5
}
```

### Checkbox Field
```javascript
{
  "fieldId": "unique_id",
  "label": "Which topics interest you?",
  "type": "checkbox",
  "required": true,
  "options": ["Topic 1", "Topic 2", "Topic 3"],
  "order": 6
}
```

## 🧪 Testing with Curl

### Get All Workshops
```bash
curl -X GET http://localhost:5000/api/workshops
```

### Create Workshop (with image)
```bash
curl -X POST http://localhost:5000/api/workshops \
  -H "Authorization: Bearer {token}" \
  -F "title=My Workshop" \
  -F "description=Description" \
  -F "date=2024-02-15" \
  -F "time=14:00" \
  -F "venue=Room 101" \
  -F "duration=2 hours" \
  -F "capacity=50" \
  -F "coverImage=@/path/to/image.jpg" \
  -F "registrationFormFields=[]"
```

### Register for Workshop
```bash
curl -X POST http://localhost:5000/api/registrations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "workshopId": "workshop_id",
    "formData": {
      "field_1": "value_1"
    }
  }'
```

## 📱 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## 🔒 User Roles

- **User**: Can view and register for workshops
- **Admin**: Can create, edit, delete workshops and manage registrations

---

**Last Updated**: 2024
**API Version**: 1.0
