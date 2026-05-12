# MongoDB Technical Club - Workshop Registration System

A full-stack web application for managing workshop registrations with an admin dashboard for creating events and dynamic form builders.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Features Overview](#features-overview)

## ✨ Features

### User Portal
- **Google OAuth Authentication** - Sign in with Google account
- **Browse Workshops** - View all available workshops and events
- **Dynamic Registration Forms** - Fill custom forms created by admins
- **Registration Management** - View and manage your registrations
- **Responsive Design** - Works on desktop and mobile devices

### Admin Portal
- **Create Workshops** - Add new workshops with cover images and details
- **Dynamic Form Builder** - Create custom registration forms with:
  - Text fields
  - Email fields
  - Phone fields
  - Textarea
  - Dropdowns
  - Radio buttons
  - Checkboxes
- **View Registrations** - See all registrations for each workshop in a table format
- **Export to Excel** - Download registrations as Excel (.xlsx) files
- **Workshop Management** - Edit, delete, and toggle workshop status

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Google OAuth** - Authentication
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Multer** - File upload handling
- **ExcelJS** - Excel export
- **JWT** - Token authentication
- **CORS** - Cross-origin requests

## 📁 Project Structure

```
mclub/
├── client/                          # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── UI.jsx
│   │   │   ├── WorkshopCard.jsx
│   │   │   ├── RegistrationForm.jsx
│   │   │   ├── FormBuilder.jsx
│   │   │   ├── AdminWorkshopCard.jsx
│   │   │   ├── RegistrationsTable.jsx
│   │   │   └── CreateWorkshopModal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── pages/                   # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── WorkshopsPage.jsx
│   │   │   ├── WorkshopDetailPage.jsx
│   │   │   ├── MyRegistrationsPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── RegistrationsPage.jsx
│   │   ├── utils/
│   │   │   └── api.js               # API calls
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                          # Node.js Backend
│   ├── controllers/                 # Business logic
│   │   ├── authController.js
│   │   ├── workshopController.js
│   │   └── registrationController.js
│   ├── middleware/                  # Express middleware
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/                      # MongoDB schemas
│   │   ├── User.js
│   │   ├── Workshop.js
│   │   └── Registration.js
│   ├── routes/                      # API routes
│   │   ├── auth.js
│   │   ├── workshops.js
│   │   └── registrations.js
│   ├── utils/
│   │   └── excelExport.js
│   ├── uploads/                     # Uploaded images
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── README.md                        # This file
└── .gitignore
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (for cloud database)
- Google OAuth credentials

### Step 1: Clone the Repository

```bash
cd mclub
```

### Step 2: Setup Backend

```bash
cd server

# Copy .env.example to .env and update values
cp .env.example .env

# Install dependencies
npm install

# Update .env with your values:
# - MONGODB_URI: Your MongoDB connection string
# - GOOGLE_CLIENT_ID: From Google OAuth
# - GOOGLE_CLIENT_SECRET: From Google OAuth
# - JWT_SECRET: Generate a random string
```

### Step 3: Setup Frontend

```bash
cd ../client

# Copy .env.example to .env and update values
cp .env.example .env

# Install dependencies
npm install

# Update .env with your values:
# - VITE_API_URL: Backend API URL (http://localhost:5000/api)
# - VITE_GOOGLE_CLIENT_ID: Same as backend
```

## ⚙️ Environment Configuration

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workshop-db
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_super_secret_jwt_key_change_this
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000` and `http://localhost:5000` to authorized origins
6. Copy Client ID and Client Secret to your `.env` files

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Get connection string and add to `.env`
5. Connection string format: `mongodb+srv://username:password@cluster.mongodb.net/workshop-db`

## ▶️ Running the Application

### Terminal 1 - Start Backend

```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Terminal 2 - Start Frontend

```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

The application will automatically open in your browser at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Verify Google Token
```
POST /api/auth/verify-token
Body: { token: string }
Response: { success: true, token: string, user: User }
```

#### Get User Profile
```
GET /api/auth/profile
Headers: { Authorization: "Bearer {token}" }
Response: User object
```

#### Update User Profile
```
PUT /api/auth/profile
Headers: { Authorization: "Bearer {token}" }
Body: { name: string, email: string }
Response: Updated user object
```

### Workshop Endpoints

#### Get All Workshops
```
GET /api/workshops
Response: Workshop[]
```

#### Get Workshop by ID
```
GET /api/workshops/:id
Response: Workshop object
```

#### Create Workshop (Admin Only)
```
POST /api/workshops
Headers: { Authorization: "Bearer {token}" }
Body: FormData with workshop details and coverImage
Response: { success: true, workshop: Workshop }
```

#### Update Workshop (Admin Only)
```
PUT /api/workshops/:id
Headers: { Authorization: "Bearer {token}" }
Body: FormData with updated workshop details
Response: { success: true, workshop: Workshop }
```

#### Delete Workshop (Admin Only)
```
DELETE /api/workshops/:id
Headers: { Authorization: "Bearer {token}" }
Response: { success: true, message: string }
```

#### Get Admin's Workshops
```
GET /api/workshops/admin/my-workshops
Headers: { Authorization: "Bearer {token}" }
Response: Workshop[]
```

### Registration Endpoints

#### Register for Workshop
```
POST /api/registrations
Headers: { Authorization: "Bearer {token}" }
Body: { workshopId: string, formData: object }
Response: { success: true, registration: Registration }
```

#### Get User's Registrations
```
GET /api/registrations/my-registrations
Headers: { Authorization: "Bearer {token}" }
Response: Registration[]
```

#### Get Workshop Registrations (Admin Only)
```
GET /api/registrations/workshop/:workshopId
Headers: { Authorization: "Bearer {token}" }
Response: Registration[]
```

#### Export Registrations to Excel (Admin Only)
```
GET /api/registrations/workshop/:workshopId/export
Headers: { Authorization: "Bearer {token}" }
Response: Excel file (.xlsx)
```

#### Cancel Registration
```
DELETE /api/registrations/:registrationId
Headers: { Authorization: "Bearer {token}" }
Response: { success: true, message: string }
```

#### Delete Registration (Admin Only)
```
DELETE /api/registrations/admin/:registrationId
Headers: { Authorization: "Bearer {token}" }
Body: { workshopId: string }
Response: { success: true, message: string }
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  googleId: String (unique),
  email: String (unique),
  name: String,
  profilePhoto: String,
  isAdmin: Boolean,
  createdAt: Date
}
```

### Workshops Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  coverImage: String,
  date: Date,
  time: String,
  venue: String,
  capacity: Number,
  duration: String,
  registrationFormFields: [{
    fieldId: String,
    label: String,
    type: String,
    required: Boolean,
    options: [String],
    order: Number
  }],
  createdBy: ObjectId (ref: User),
  registrationCount: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Registrations Collection
```javascript
{
  _id: ObjectId,
  workshopId: ObjectId (ref: Workshop),
  userId: ObjectId (ref: User),
  formData: Map<String, String>,
  status: String (enum: ['confirmed', 'pending', 'cancelled']),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Features Overview

### User Portal Features

1. **Google OAuth Login**
   - One-click sign in with Google
   - Automatically stores user profile information
   - Secure JWT token generation

2. **Workshop Discovery**
   - Browse all available workshops
   - Search workshops by title, description, or venue
   - View detailed workshop information
   - See registration count and capacity

3. **Registration**
   - Dynamic registration forms built by admins
   - Support for various field types
   - Form validation
   - Confirmation messages

4. **Registration Management**
   - View all your registrations
   - See registration status
   - Cancel registrations
   - View submitted form data

### Admin Portal Features

1. **Workshop Management**
   - Create new workshops
   - Upload cover images
   - Edit workshop details
   - Delete workshops
   - Toggle workshop status
   - Set capacity limits

2. **Form Builder**
   - Add custom form fields
   - Support for:
     - Text, email, phone, textarea
     - Dropdowns, radio buttons, checkboxes
   - Mark fields as required/optional
   - Drag to reorder fields
   - Remove fields

3. **Registration Management**
   - View all registrations for a workshop
   - See user information
   - Delete individual registrations
   - Export registrations to Excel

4. **Excel Export**
   - Download registrations as .xlsx files
   - Formatted with headers and styling
   - Includes all form data
   - Professional appearance

## 🔐 Security Features

- Google OAuth 2.0 authentication
- JWT token-based authorization
- Admin-only routes protection
- CORS configuration
- File upload validation
- Input validation and sanitization
- Secure password-less authentication

## 📱 Responsive Design

- Mobile-first approach
- Responsive navigation bar
- Mobile-friendly forms and cards
- Touch-optimized buttons and inputs
- Optimized for all screen sizes

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify connection string in .env
- Check MongoDB Atlas IP whitelist
- Ensure database credentials are correct

### Google OAuth Issues
- Verify client ID is correct
- Check authorized redirect URIs
- Ensure origins are whitelisted

### File Upload Issues
- Check uploads directory permissions
- Verify file size limits (max 10MB)
- Ensure correct MIME types

### CORS Errors
- Verify FRONTEND_URL in backend .env
- Check that backend is running on correct port
- Clear browser cache

## 📦 NPM Scripts

### Backend
```bash
npm run dev      # Start with nodemon
npm start        # Start production
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📞 Support

For issues and questions, please contact the MongoDB Technical Club administrators.

---

**Happy Learning! 🚀 MongoDB Club**
