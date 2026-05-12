# 📋 Complete Setup & Deployment Guide

## 🎯 Project Overview

This is a full-stack Workshop Registration Management System built with:
- **Frontend**: React.js + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Google OAuth 2.0
- **Export**: Excel (.xlsx) files

## 📅 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **npm** or **yarn** (comes with Node.js)
3. **MongoDB Atlas Account** - [Sign up free](https://www.mongodb.com/cloud/atlas)
4. **Google Cloud Account** - [Create account](https://cloud.google.com/)
5. **Git** - [Download](https://git-scm.com/)
6. **A code editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

## 🔐 Step 1: Setup Google OAuth Credentials

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: Click "Select a Project" → "NEW PROJECT"
3. Enter project name: "MongoDB Club Workshop"
4. Click "Create"
5. Wait for project to be created

### 1.2 Enable Google+ API

1. In the Cloud Console, search for "Google+ API"
2. Click on "Google+ API"
3. Click "ENABLE"

### 1.3 Create OAuth Credentials

1. Go to "Credentials" in left sidebar
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Choose "Web application"
4. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000`
   - `http://localhost:5000`
5. Under "Authorized redirect URIs", add:
   - `http://localhost:3000`
   - `http://localhost:5000`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**
8. Store them safely - you'll need them next

## 🗄️ Step 2: Setup MongoDB Atlas

### 2.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up with Google or create account
3. Verify your email

### 2.2 Create a Cluster

1. Click "Create" to build a cluster
2. Choose "Shared" (free tier)
3. Select your preferred region (recommended: closest to you)
4. Click "Create Cluster"
5. Wait for cluster to be created (usually 5-10 minutes)

### 2.3 Create Database User

1. Go to "Database Access" in left sidebar
2. Click "ADD NEW DATABASE USER"
3. Enter username (e.g., `mclub_user`)
4. Generate password (copy and save it)
5. Click "Add User"

### 2.4 Get Connection String

1. Go to "Clusters" → Click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>` and `<password>` with your credentials
5. Example: `mongodb+srv://mclub_user:password123@cluster.mongodb.net/workshop-db`

### 2.5 Configure Network Access

1. Go to "Network Access"
2. Click "ADD IP ADDRESS"
3. Choose "Allow access from anywhere" (for development)
4. Click "Confirm"

## 💻 Step 3: Clone Project & Install Dependencies

### 3.1 Clone Repository

```bash
# Navigate to your desired directory
cd ~/Downloads  # or any directory you prefer

# Clone the project (or copy the mclub folder if already downloaded)
# If cloning from GitHub:
git clone <repository-url>

cd mclub
```

### 3.2 Install Backend Dependencies

```bash
cd server

# Install all dependencies
npm install

# You should see:
# added XXX packages in X.XXs
```

### 3.3 Install Frontend Dependencies

```bash
cd ../client

# Install all dependencies
npm install

# You should see:
# added XXX packages in X.XXs

# Go back to root
cd ..
```

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Backend Configuration

```bash
cd server

# Copy example file
cp .env.example .env

# Edit .env with your credentials
# Windows: notepad .env
# Mac/Linux: nano .env  or  vim .env
```

Update `.env` with:

```env
PORT=5000
MONGODB_URI=mongodb+srv://mclub_user:password123@cluster.mongodb.net/workshop-db
GOOGLE_CLIENT_ID=your_google_client_id_from_step_1
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_step_1
JWT_SECRET=change_this_to_a_random_secret_key_like_abc123xyz789
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**⚠️ Important**: Replace the values with your actual credentials!

### 4.2 Frontend Configuration

```bash
cd ../client

# Copy example file
cp .env.example .env

# Edit .env
# Windows: notepad .env
# Mac/Linux: nano .env
```

Update `.env` with:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_from_step_1
```

## 🚀 Step 5: Run the Application

### 5.1 Start Backend Server

**Open a new terminal window/tab**:

```bash
cd mclub/server

# Start the server
npm run dev

# You should see:
# Server running on port 5000
# MongoDB connected successfully
```

### 5.2 Start Frontend Server

**Open another terminal window/tab**:

```bash
cd mclub/client

# Start the frontend
npm run dev

# You should see:
# VITE v4.x.x  ready in XXX ms
# Local: http://localhost:3000
# The browser should open automatically
```

### ✅ You're Running!

Both servers should now be running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 🧪 Step 6: Test the Application

### 6.1 Test User Portal

1. **Homepage**: Should load with hero section and features
2. **Login**: Click "Get Started" and sign in with Google
3. **Browse Workshops**: Click "Workshops" (should show "No workshops available" initially)
4. **View Profile**: Check your name and email in navbar

### 6.2 Setup Admin Account

To create an admin account:

1. Sign in with Google
2. Open MongoDB Atlas → Collections
3. Find "users" collection
4. Click on your user entry
5. Change `isAdmin` from `false` to `true`
6. Refresh the page - "Admin" link should now appear in navbar

### 6.3 Test Admin Portal

1. **Admin Dashboard**: Click "Admin" in navbar
2. **Create Workshop**: 
   - Click "Create Workshop"
   - Fill in details
   - Upload a cover image
   - Add form fields (add at least one field)
   - Click "Create Workshop"
3. **View Workshop**: Should appear on dashboard
4. **Go to Workshops**: Sign in with another account (or new Google account)
5. **Register**: Click workshop → "Register" → Fill form → Submit
6. **View Registrations**: As admin, click "Registrations" on workshop card
7. **Export**: Click "Export" to download Excel file

## 📱 Available Features to Test

### User Features
- ✅ Google OAuth login/signup
- ✅ View all workshops
- ✅ Search workshops
- ✅ View workshop details
- ✅ Register for workshops
- ✅ View my registrations
- ✅ Cancel registrations

### Admin Features
- ✅ Create workshops
- ✅ Upload cover images
- ✅ Create custom registration forms
- ✅ Edit workshops
- ✅ Delete workshops
- ✅ View all registrations
- ✅ Delete registrations
- ✅ Export to Excel
- ✅ Toggle workshop status

## 🔍 Common Issues & Solutions

### Issue: "MongoDB connection error"
```
Solution:
1. Verify MONGODB_URI in .env is correct
2. Check IP whitelist in MongoDB Atlas (should include 0.0.0.0/0)
3. Ensure cluster is running (not paused)
4. Test connection string
```

### Issue: "Google login not working"
```
Solution:
1. Verify GOOGLE_CLIENT_ID matches Google Cloud Console
2. Check authorized origins in Google Cloud Console
3. Clear browser cache and cookies
4. Check browser console for errors (F12)
```

### Issue: "Cannot upload image"
```
Solution:
1. Check file size (max 10MB)
2. Verify file format (JPG, PNG, GIF, WebP)
3. Check uploads folder exists and is writable
4. Check terminal for detailed error
```

### Issue: "Port already in use"
```
Solution:
# Kill process on port 5000
Windows: netstat -ano | findstr :5000 → taskkill /PID <PID> /F
Mac/Linux: lsof -i :5000 → kill -9 <PID>

# Or use different port:
Change PORT in .env to 5001 or 5002
```

## 📚 Project Documentation

For detailed information, read:
- [Main README.md](./README.md) - Project overview
- [Server README.md](./server/README.md) - Backend details
- [Client README.md](./client/README.md) - Frontend details

## 🚢 Deployment Guide

### Deploy Backend (Node.js)

#### Option 1: Heroku (Free alternative now uses paid dynos)

```bash
# Install Heroku CLI
# At https://devcenter.heroku.com/articles/heroku-cli

heroku login
heroku create your-app-name
git push heroku main
heroku config:set PORT=5000
heroku config:set MONGODB_URI=your_mongodb_uri
# ... set other environment variables
```

#### Option 2: Railway.app (Simple & Free tier available)

1. Go to [Railway.app](https://railway.app)
2. Sign up and connect GitHub
3. Import your repository
4. Add MongoDB plugin or set MongoDB URL
5. Deploy!

#### Option 3: Render.com (Easy deployment)

1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set environment variables
5. Deploy!

### Deploy Frontend (React)

#### Option 1: Vercel (Recommended for React)

```bash
npm install -g vercel
vercel
# Follow prompts to connect and deploy
```

#### Option 2: Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy
```

#### Option 3: GitHub Pages

```bash
npm run build
# Upload dist/ folder to GitHub Pages
```

## 🔐 Security Checklist for Production

- [ ] Change all default passwords and secrets
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Configure CORS properly for production domain
- [ ] Set JWT_SECRET to a strong random string
- [ ] Enable MongoDB Atlas IP whitelist for production IPs only
- [ ] Setup database backups
- [ ] Enable API rate limiting
- [ ] Use HTTPS for Google OAuth redirects
- [ ] Add input validation and sanitization
- [ ] Setup monitoring and logging
- [ ] Regular security audits

## 📞 Support & Troubleshooting

### Check Logs

**Backend**:
```bash
# Terminal with npm run dev will show logs
# Look for errors and connection status
```

**Frontend**:
```bash
# Browser Console (F12)
# Network tab to see API calls
# Check for red error messages
```

### Get Help

1. Check the README files in each folder
2. Search for error message in browser console
3. Check terminal output for backend errors
4. Verify all .env variables are set correctly
5. Test API endpoints with Postman/Thunder Client

## 🎉 Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected successfully
- [ ] Google OAuth working
- [ ] Can create workshop as admin
- [ ] Can register for workshop as user
- [ ] Can export registrations to Excel
- [ ] Responsive design works on mobile

## 📖 Next Steps

1. **Customize Branding**: Update logo, colors, and text
2. **Add More Features**: Email notifications, workshop categories, etc.
3. **Improve UI**: Add more animations and polish
4. **Setup Analytics**: Track user interactions
5. **Deploy to Production**: Follow deployment guide above

## 📝 Notes

- Keep your .env files secure - never commit them to Git
- Always use HTTPS in production
- Regularly backup your MongoDB database
- Monitor your application for errors and performance
- Update dependencies regularly for security patches

---

**You're all set! 🚀 Start building amazing workshops!**

For questions or issues, refer to the detailed README files in the `server/` and `client/` directories.
