# 🚀 START HERE - Workshop Registration System

Welcome! This guide will help you get the complete Workshop Registration System up and running in minutes.

## 📚 What You Have

You have a **production-ready, full-stack Workshop Registration System** with:

### ✨ Frontend (React)
- Beautiful, responsive UI with Tailwind CSS
- Google OAuth authentication
- Workshop browsing and registration
- User dashboard with registrations
- Admin panel for workshop management
- Dynamic form builder for custom registration fields
- Excel export functionality

### 🔧 Backend (Node.js + Express)
- RESTful API with 16 endpoints
- MongoDB integration with Mongoose
- JWT authentication
- Google OAuth verification
- File upload for workshop images
- Excel report generation
- Role-based access control

### 📊 Database (MongoDB)
- Users collection (authentication)
- Workshops collection (events data)
- Registrations collection (user registrations)
- Automatic indexing and relationships

---

## ⚡ Quick Start (5 minutes)

### Step 1: Configure Your System (First Time Only)

```bash
# From the project root directory
bash setup.sh
```

This interactive script will ask for:
1. **MongoDB Connection String** - Get from MongoDB Atlas
2. **Google Client ID** - Get from Google Cloud Console
3. **Google Client Secret** - Generated automatically

**Don't have these yet?** See "Getting Credentials" section below.

### Step 2: Start the Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

You should see:
```
[nodemon] starting `node server.js`
MongoDB connected successfully
Server running on port 5000 ✅
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

You should see:
```
VITE v4.5.14  ready in 237 ms
➜  Local: http://localhost:3000/ ✅
```

### Step 3: Open in Browser

Visit: **http://localhost:3000**

You should see the MongoDB Club homepage! ✅

---

## 🔐 Getting Credentials

### MongoDB URI

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Click "Create a Deployment" → Select "Shared" (free)
4. Wait 2-5 minutes for cluster to be ready
5. Click "Connect" → "Drivers"
6. Copy the connection string
7. Replace `<username>` and `<password>` with your database user credentials

**Format:** `mongodb+srv://username:password@cluster.mongodb.net/workshop-db`

### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Name it "Workshop Registration"
4. Go to "APIs & Services" → "Enabled APIs"
5. Search and enable "Google+ API"
6. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
7. Select "Web application"
8. Add authorized origins:
   - `http://localhost:3000`
   - `http://localhost:5000`
9. Create and copy your Client ID and Client Secret

---

## 🧪 Test the System

### Test 1: Frontend Loads ✅
- Visit http://localhost:3000
- See homepage
- Click "Workshops" link

### Test 2: Google Login ✅
- Click "Login" button
- Sign in with your Google account
- Get redirected back to the app

### Test 3: Create Workshop (Admin)
**First, set your account as admin:**
1. Use MongoDB Compass (free GUI) to connect
2. Find your user in `users` collection
3. Change `isAdmin` from `false` to `true`

**Then create a workshop:**
1. Go to http://localhost:3000/admin
2. Click "Create Workshop"
3. Fill in the form
4. Click "Create"

### Test 4: Register for Workshop
1. Go to http://localhost:3000/workshops
2. Click the workshop you created
3. Fill in the registration form
4. Click "Register"

### Test 5: View Registrations
1. Click "My Events" in navbar
2. See your registration

### Test 6: Export to Excel (Admin)
1. In admin panel
2. Click workshop → "View Registrations"
3. Click "Export to Excel"
4. Check Downloads folder

---

## 📖 Documentation

All documentation is in the root directory:

| File | Purpose |
|------|---------|
| **COMPLETE_SETUP.md** | Detailed setup with troubleshooting |
| **TESTING.md** | Comprehensive testing guide |
| **DEPLOYMENT.md** | Production deployment (Heroku, AWS, etc.) |
| **API_REFERENCE.md** | All API endpoints |
| **PROJECT_SUMMARY.md** | Complete feature list |
| **README.md** | Project overview |

---

## 🎯 What's Next?

### Development Work
- [ ] Set up credentials (MongoDB, Google OAuth)
- [ ] Run `bash setup.sh`
- [ ] Start both servers
- [ ] Test all features
- [ ] Make any custom modifications

### Going to Production
- [ ] Read DEPLOYMENT.md
- [ ] Choose hosting platform (Heroku, Vercel, etc.)
- [ ] Set up production MongoDB cluster
- [ ] Update Google OAuth with production URLs
- [ ] Deploy frontend and backend
- [ ] Set up monitoring and backups

### Adding Features
- Add email notifications
- Add calendar integration
- Add multiple event types
- Add payment processing
- Add email invitations

---

## 💡 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                           │
│              http://localhost:3000                   │
└──────────────────────┬────────────────────────────────┘
                       │
                       │ REST API Calls
                       ↓
┌─────────────────────────────────────────────────────┐
│                  NODE.JS/EXPRESS                     │
│              http://localhost:5000                   │
│                                                      │
│  Routes:                                             │
│  ├── /api/auth     → Google OAuth & JWT              │
│  ├── /api/workshops → CRUD operations                │
│  └── /api/registrations → User registrations         │
└──────────────────────┬────────────────────────────────┘
                       │
            Mongoose ODM
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│                    MONGODB                           │
│                                                      │
│  Collections:                                        │
│  ├── users (authentication)                          │
│  ├── workshops (events)                              │
│  └── registrations (user signups)                    │
└─────────────────────────────────────────────────────┘
```

---

## ⚙️ Technology Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Custom React Components
- **HTTP Client:** Axios
- **Auth:** Google OAuth 2.0
- **Icons:** React Icons
- **State:** Context API

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + Google OAuth
- **File Upload:** Multer
- **Excel Export:** ExcelJS

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` in server/ and client/ |
| "MongoDB connection failed" | Check MONGODB_URI in .env |
| "Blank page on localhost:3000" | Clear browser cache (Cmd+Shift+R) |
| "Cannot POST /api/..." | Check Authorization header in requests |
| "Port already in use" | Kill process: `lsof -i :PORT` then `kill PID` |

See **COMPLETE_SETUP.md** for more troubleshooting.

---

## 📞 Support

For detailed information, check these files:

1. **Setup Issues?** → COMPLETE_SETUP.md
2. **Testing?** → TESTING.md
3. **Deployment?** → DEPLOYMENT.md
4. **API Details?** → API_REFERENCE.md
5. **Feature Overview?** → PROJECT_SUMMARY.md

---

## ✅ Verification Checklist

After following this guide, verify:

- [ ] Both servers are running (no errors)
- [ ] Can visit http://localhost:3000
- [ ] Can see beautiful homepage
- [ ] Google Sign-In button works
- [ ] Can create/view workshops
- [ ] Can register for workshops
- [ ] Admin features work

**If all checks pass, you're ready to customize and deploy! 🎉**

---

## 🚀 You're All Set!

Your Workshop Registration System is ready to use. Go build something amazing!

**Next Step:** Run `bash setup.sh` to configure your credentials.

