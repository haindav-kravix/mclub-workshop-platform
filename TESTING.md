# Testing Guide - Workshop Registration System

This guide walks through testing all features of the system using curl, Postman, or your browser.

## 🚀 Prerequisites

- Both frontend and backend servers running
- MongoDB connected
- Google OAuth configured
- User account created and logged in

## 🧪 API Testing with cURL

### 1. Test Backend Health

```bash
# Test if server is running
curl http://localhost:5000/

# Expected response: Server running on port 5000
```

### 2. Test Workshops Endpoint (No Authentication)

```bash
# Get all workshops
curl http://localhost:5000/api/workshops

# Expected response: [] (empty array) or array of workshops
```

### 3. Test Authentication Flow

```bash
# After getting Google credential token from frontend:
curl -X POST http://localhost:5000/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "your-google-credential-token-here"
  }'

# Expected response:
# {
#   "token": "your-jwt-token",
#   "user": {
#     "_id": "...",
#     "email": "your-email@gmail.com",
#     "name": "Your Name",
#     "isAdmin": false
#   }
# }
```

### 4. Get User Profile (Authenticated)

```bash
# Replace YOUR_JWT_TOKEN with actual token from previous request
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📱 Browser Testing

### Test 1: Homepage
- **URL:** http://localhost:3000
- **Expected:** See MongoDB Club homepage with hero section and features
- **Test:** Click "Login" button

### Test 2: Google Sign-In
- **URL:** http://localhost:3000/login
- **Expected:** Google Sign-In button appears
- **Action:** Click button and sign in with your Google account
- **Result:** Redirected to homepage, logged in

### Test 3: Workshops Page
- **URL:** http://localhost:3000/workshops (after login)
- **Expected:** Empty list initially (no workshops created yet)
- **Test:** Click on a workshop to see details

### Test 4: Create Workshop (Admin Only)
**Prerequisite:** Set your account as admin

1. Go to http://localhost:3000/admin
2. Click "Create Workshop"
3. Fill in the form:
   - **Title:** MongoDB 101
   - **Description:** Introduction to MongoDB basics
   - **Cover Image:** (Upload an image or leave blank)
   - **Date:** Pick a future date
   - **Time:** 10:00 AM
   - **Venue:** Online
   - **Duration:** 2 hours
   - **Capacity:** 50
4. Add custom form fields:
   - **Field 1:** Full Name (type: text, required: yes)
   - **Field 2:** Email (type: email, required: yes)
   - **Field 3:** Experience Level (type: select, options: Beginner, Intermediate, Advanced)
5. Click "Create Workshop"

**Expected:** Workshop appears in the workshop list

### Test 5: Register for Workshop
1. Go to http://localhost:3000/workshops
2. Click on the workshop you created
3. Click "Register Now"
4. Fill in the registration form
5. Click "Register"

**Expected:** Modal closes, registration confirmed

### Test 6: View My Registrations
1. Click "My Events" in navbar
2. See your registration listed
3. View all the details you submitted

**Expected:** Registration form data is displayed correctly

### Test 7: Admin View Registrations
1. Go to http://localhost:3000/admin
2. Click on a workshop card
3. Click "View Registrations"

**Expected:** See a table of all registrations with user info

### Test 8: Export to Excel
1. In registrations table, click "Export to Excel"
2. Check Downloads folder

**Expected:** `.xlsx` file created with registration data

### Test 9: Cancel Registration
1. Go to http://localhost:3000/my-registrations
2. Click the cancel/delete button on a registration

**Expected:** Registration removed from your list

### Test 10: Logout
1. Click profile menu in navbar
2. Click "Logout"

**Expected:** Logged out, redirected to homepage

## 🔍 Advanced Testing

### Test Admin Dashboard Features

```bash
# Get admin's workshops
curl http://localhost:5000/api/admin/workshops \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get workshop registrations
curl http://localhost:5000/api/registrations/workshop/WORKSHOP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Export registrations to Excel
curl http://localhost:5000/api/registrations/export/WORKSHOP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o registrations.xlsx
```

### Test Error Cases

#### Try to access admin endpoints without being admin
```bash
curl http://localhost:5000/api/admin/workshops \
  -H "Authorization: Bearer NON_ADMIN_USER_TOKEN"

# Expected: 403 Forbidden
```

#### Try to create workshop without authentication
```bash
curl -X POST http://localhost:5000/api/workshops \
  -H "Content-Type: application/json" \
  -d '{ "title": "Test" }'

# Expected: 401 Unauthorized
```

#### Try to register with invalid workshop ID
```bash
curl -X POST http://localhost:5000/api/registrations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workshopId": "invalid_id",
    "formData": {"name": "Test"}
  }'

# Expected: 404 Not Found
```

## 📊 Test Scenarios

### Scenario 1: User Registration Flow
1. ✅ User signs in with Google
2. ✅ Sees available workshops
3. ✅ Registers for a workshop
4. ✅ Receives confirmation
5. ✅ Can see registration in "My Events"

### Scenario 2: Admin Workshop Management
1. ✅ Admin creates a workshop with custom form
2. ✅ Workshop appears in workshop list
3. ✅ Users can register
4. ✅ Admin sees all registrations
5. ✅ Admin can export to Excel

### Scenario 3: Registration Form Customization
1. ✅ Create workshop with form fields (text, email, select, radio, checkbox)
2. ✅ User fills all field types during registration
3. ✅ Data is stored correctly
4. ✅ Data appears in admin view

### Scenario 4: Workshop Capacity Management
1. ✅ Create workshop with capacity: 2
2. ✅ Register first user (1/2)
3. ✅ Register second user (2/2)
4. ✅ Try to register third user (should fail - capacity reached)

## 🐛 Debugging Tips

### Check Backend Logs
```bash
# In the server terminal, you should see:
# - Incoming API requests
# - Database operations
# - Error messages
```

### Check Frontend Logs
```bash
# In browser console (F12), check:
# - Network tab for API requests
# - Console tab for JavaScript errors
# - Application tab for localStorage (JWT token)
```

### Check Database
```bash
# Using MongoDB Compass or Atlas UI:
# 1. View users collection - see created users
# 2. View workshops collection - see created workshops
# 3. View registrations collection - see user registrations
```

## ✅ Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] MongoDB connected (check server logs)
- [ ] Google OAuth configured (can see Sign-In button)
- [ ] User account created (signed in)
- [ ] Account set as admin
- [ ] Can create workshops
- [ ] Can register for workshops
- [ ] Can export registrations
- [ ] All form fields work correctly
- [ ] Logout works
- [ ] Responsive on mobile

## 📞 Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Cannot POST /api/workshops" | Check Authorization header, must have Bearer token |
| "Workshop not found" | Use correct workshop ID, check in MongoDB |
| "Capacity exceeded" | Workshop is full, can't register more users |
| "Invalid token" | JWT token expired or invalid, need to log in again |
| "Google authentication failed" | Check GOOGLE_CLIENT_ID in .env matches console.cloud.google.com |

