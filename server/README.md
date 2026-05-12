# MongoDB Workshop Registration System - Backend Setup Guide

## 🚀 Quick Start

### Installation

```bash
cd server
npm install
cp .env.example .env
```

### Configuration

Edit `.env` and add your credentials:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workshop-db
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## 🏗️ Project Structure

```
server/
├── controllers/          # Business logic
│   ├── authController.js
│   ├── workshopController.js
│   └── registrationController.js
├── middleware/          # Express middleware
│   ├── auth.js         # JWT authentication
│   └── upload.js       # File upload handling
├── models/             # MongoDB schemas
│   ├── User.js
│   ├── Workshop.js
│   └── Registration.js
├── routes/             # API endpoints
│   ├── auth.js
│   ├── workshops.js
│   └── registrations.js
├── utils/              # Utility functions
│   └── excelExport.js
├── uploads/            # Uploaded images directory
├── .env.example
├── package.json
└── server.js          # Entry point
```

## 📚 API Routes

### Authentication Routes
- `POST /api/auth/verify-token` - Verify Google token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Workshop Routes
- `GET /api/workshops` - Get all workshops
- `GET /api/workshops/:id` - Get workshop by ID
- `POST /api/workshops` - Create workshop (admin)
- `PUT /api/workshops/:id` - Update workshop (admin)
- `DELETE /api/workshops/:id` - Delete workshop (admin)
- `GET /api/workshops/admin/my-workshops` - Get admin's workshops
- `PATCH /api/workshops/:id/toggle` - Toggle workshop status (admin)

### Registration Routes
- `POST /api/registrations` - Register for workshop
- `GET /api/registrations/my-registrations` - Get user's registrations
- `GET /api/registrations/workshop/:workshopId` - Get workshop registrations (admin)
- `GET /api/registrations/workshop/:workshopId/export` - Export to Excel (admin)
- `DELETE /api/registrations/:registrationId` - Cancel registration
- `DELETE /api/registrations/admin/:registrationId` - Delete registration (admin)

## 🗄️ Database Collections

### Users
- Google OAuth ID, email, name, profile photo
- Admin flag for access control

### Workshops
- Title, description, cover image
- Date, time, venue, duration, capacity
- Custom registration form fields
- Created by user ID
- Registration count
- Active status

### Registrations
- Workshop ID and User ID
- Form data (key-value pairs)
- Status (confirmed, pending, cancelled)
- Created and updated timestamps

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | Yes |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | Yes |
| JWT_SECRET | Secret for JWT signing | Yes |
| NODE_ENV | Environment (development/production) | Yes |
| FRONTEND_URL | Frontend application URL | Yes |

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. User signs in with Google OAuth
2. Google token verified on backend
3. JWT token generated and sent to frontend
4. Token included in Authorization header for protected routes
5. Token expires after 7 days

## 📤 File Upload

- Maximum file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Files stored in `uploads/` directory
- Serve at `/uploads/{filename}`

## 📊 Excel Export

Uses ExcelJS library to create formatted Excel files:
- Professional formatting with colors
- Headers and timestamps
- Dynamically includes all form data columns
- Auto-fitted column widths

## 🔒 Security

- CORS enabled for frontend
- Input validation on all endpoints
- JWT authentication for protected routes
- Admin-only routes with middleware
- File upload validation
- Mongoose schema validation

## ⚠️ Error Handling

All errors return JSON with status codes:
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

## 📝 Logging

Basic error logging to console. For production:
- Implement Winston or Morgan logging
- Store logs to file or external service

## 🧪 Testing

To test endpoints, use:
- Postman
- Thunder Client
- curl commands

Example:
```bash
curl -X POST http://localhost:5000/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "your_google_token"}'
```

## 📦 Dependencies

### Core
- `express` - Web framework
- `mongoose` - MongoDB ODM

### Authentication
- `google-auth-library` - Google OAuth
- `jsonwebtoken` - JWT tokens

### File Handling
- `multer` - File upload middleware

### Export
- `exceljs` - Excel file creation

### Utilities
- `cors` - CORS middleware
- `dotenv` - Environment variables

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a process manager (PM2)
3. Set up MongoDB Atlas with IP whitelist
4. Configure FRONTEND_URL for production
5. Use environment secrets for credentials
6. Set up HTTPS
7. Configure backup strategy

## 📞 Support

For issues:
1. Check error messages in console
2. Verify .env configuration
3. Check MongoDB connection
4. Review API documentation
5. Check browser console for frontend errors

---

**Happy Coding! 🎉**
