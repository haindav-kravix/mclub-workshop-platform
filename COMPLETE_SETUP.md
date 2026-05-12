# Complete Setup Guide - Workshop Registration System

This guide walks you through setting up and deploying the complete Workshop Registration Management System.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Setup](#mongodb-setup)
3. [Google OAuth Setup](#google-oauth-setup)
4. [Backend Configuration](#backend-configuration)
5. [Testing the System](#testing-the-system)
6. [Admin Account Setup](#admin-account-setup)
7. [Production Deployment](#production-deployment)

---

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- A web browser (Chrome, Firefox, Safari, Edge)
- MongoDB Atlas account (free tier available)
- Google Cloud account for OAuth

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended for Beginners)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Try Free" or sign in
   - Create an organization and project

2. **Create a Database Cluster**
   - Click "Create a Deployment"
   - Select "Shared" (Free) tier
   - Choose your preferred region (US, EU, APAC, etc.)
   - Click "Create Deployment"
   - Wait 2-5 minutes for cluster to be ready

3. **Create Database User**
   - In the cluster security settings, go to "Database Access"
   - Click "Add New Database User"
   - Username: `workshop_admin`
   - Password: Create a strong password (copy it somewhere safe)
   - Database User Privileges: Select "Atlas admin"
   - Click "Add User"

4. **Whitelist IP Address**
   - Go to "Network Access" in cluster settings
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0) for development
   - Note: For production, restrict to your server IP

5. **Get Connection String**
   - Click "Databases" → Your Cluster → "Connect"
   - Choose "Drivers" → "Node.js"
   - Copy the connection string
   - Replace `<username>` with `workshop_admin`
   - Replace `<password>` with your database user password
   - Replace `<database_name>` with `workshop-db`
   
   Example: `mongodb+srv://workshop_admin:YourPassword123@cluster0.abc123.mongodb.net/workshop-db`

### Option 2: Local MongoDB (Advanced)

```bash
# macOS (with Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Connection string: mongodb://localhost:27017/workshop-db
```

---

## Google OAuth Setup

### 1. Create Google Cloud Project
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Click "Select a Project" → "New Project"
- Project name: `MongoDB Workshop Registration`
- Click "Create"
- Wait for project to be created

### 2. Enable Google+ API
- Go to "APIs & Services" → "Enabled APIs & services"
- Click "Enable APIs and Services"
- Search for "Google+ API"
- Click on it and select "Enable"

### 3. Create OAuth 2.0 Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth client ID"
- Choose "Web application"
- Name it: `Workshop App`
- Under "Authorized JavaScript origins", add:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
  - `http://localhost:5000`
  - (For production: add your domain)
- Under "Authorized redirect URIs", add:
  - `http://localhost:3000/login`
  - `http://127.0.0.1:3000/login`
  - (For production: add your domain)
- Click "Create"
- Copy your Client ID and Client Secret

---

## Backend Configuration

### 1. Update Environment Variables

Edit `/server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://workshop_admin:YourPasswordHere@cluster0.abc123.mongodb.net/workshop-db
GOOGLE_CLIENT_ID=your-client-id-from-google-cloud.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-cloud
JWT_SECRET=generate_a_random_secret_key_here_min_32_chars
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

To generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Update Frontend Environment Variables

Edit `/client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-client-id-from-google-cloud.apps.googleusercontent.com
```

### 3. Start the Backend Server

```bash
cd server
npm run dev
```

You should see:
```
[nodemon] starting `node server.js`
MongoDB connected successfully
Server running on port 5000
```

---

## Testing the System

### 1. Verify Backend is Running
```bash
curl http://localhost:5000/api/workshops
# Should return: []  (empty array)
```

### 2. Test Frontend
- Open http://localhost:3000 in your browser
- You should see the MongoDB Club homepage
- All navigation links should work

### 3. Test Google Login
- Click "Login" button
- You'll be redirected to Google Sign-in
- Sign in with your Google account
- You should be logged in and see your profile

### 4. Test Creating a Workshop (Admin Only)
- After logging in as an admin, click "Admin" in the navbar
- Click "Create Workshop"
- Fill in the details:
  - Title: "MongoDB 101"
  - Description: "Introduction to MongoDB"
  - Date/Time: Pick a future date
  - Capacity: 30
  - Add form fields (Name, Email, etc.)
- Click "Create Workshop"
- You should see it in the workshop list

### 5. Test User Registration
- Go to /workshops
- Click on a workshop
- Fill in the registration form
- Click "Register"
- Check your registrations at /my-registrations

### 6. Test Excel Export
- As admin, go to a workshop's registrations
- Click "Export to Excel"
- Check your Downloads folder

---

## Admin Account Setup

To make your account an admin:

### Method 1: MongoDB Compass (GUI)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect with your MongoDB URI
3. Navigate to `workshop-db` → `users`
4. Find your user document
5. Edit the document and change `"isAdmin": false` to `"isAdmin": true`
6. Refresh your browser

### Method 2: Command Line
```bash
mongosh "your-mongodb-uri"
use workshop-db
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { isAdmin: true } }
)
```

### Method 3: Using the Application (Create via Code)
Edit `/server/controllers/authController.js` temporarily:
```javascript
// After user creation, set first user as admin
const userCount = await User.countDocuments();
userData.isAdmin = userCount === 1; // First user is admin
```

After your first login, revert this change.

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/verify-token` - Verify Google token and get JWT
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Workshops
- `GET /api/workshops` - Get all workshops
- `GET /api/workshops/:id` - Get workshop details
- `POST /api/workshops` - Create workshop (admin only)
- `PUT /api/workshops/:id` - Update workshop (admin only)
- `DELETE /api/workshops/:id` - Delete workshop (admin only)
- `GET /api/admin/workshops` - Get admin's workshops
- `PATCH /api/workshops/:id/toggle-status` - Activate/deactivate

### Registrations
- `POST /api/registrations` - Register for workshop
- `GET /api/registrations/my` - Get user's registrations
- `GET /api/registrations/workshop/:workshopId` - Get workshop registrations (admin)
- `GET /api/registrations/export/:workshopId` - Export to Excel (admin)
- `DELETE /api/registrations/:id` - Cancel/delete registration

---

## Troubleshooting

### MongoDB Connection Error
```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net
```
**Solution:** 
- Check your MongoDB URI is correct
- Verify IP address is whitelisted in Atlas
- Ensure your database user password is correct

### Google OAuth Not Working
```
Error: Invalid client ID
```
**Solution:**
- Verify GOOGLE_CLIENT_ID in .env matches Google Cloud Console
- Check that localhost:3000 is in authorized origins
- Clear browser cookies and try again

### Localhost Refused Connection
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```
**Solution:**
- Ensure backend server is running: `npm run dev` in /server
- Check PORT 5000 is not in use: `lsof -i :5000`
- Kill the process and restart

### React App Not Loading
```
Blank page with 404 errors
```
**Solution:**
- Clear browser cache (Cmd+Shift+R on Mac)
- Delete `/client/node_modules` and run `npm install` again
- Restart frontend: `npm run dev` in /client

---

## Production Deployment

### Using Heroku

1. **Prepare for Heroku**
   ```bash
   # Create Procfile in root
   echo "web: cd server && npm start" > Procfile
   ```

2. **Deploy Backend**
   ```bash
   heroku create your-app-name
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set GOOGLE_CLIENT_ID="your-client-id"
   heroku config:set GOOGLE_CLIENT_SECRET="your-secret"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set NODE_ENV="production"
   git push heroku main
   ```

3. **Deploy Frontend**
   - Build: `npm run build` in /client
   - Deploy to Vercel: `vercel --prod`
   - Or serve from your Node.js backend

### Using AWS / DigitalOcean / Render

See the individual platform documentation for Node.js and React deployment.

---

## Next Steps

1. ✅ Get MongoDB Atlas connection string
2. ✅ Set up Google OAuth credentials
3. ✅ Update .env files
4. ✅ Start backend: `npm run dev`
5. ✅ Start frontend: `npm run dev`
6. ✅ Test the system
7. ✅ Set your account as admin
8. ✅ Create test workshops
9. ✅ Test user registration flow

## Need Help?

Check the documentation files:
- `README.md` - Project overview
- `QUICKSTART.md` - Quick reference
- `API_REFERENCE.md` - Detailed API docs
- `PROJECT_SUMMARY.md` - Feature list

