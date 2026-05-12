# ⚡ Quick Start Checklist

## 📋 Before You Start

- [ ] Node.js installed (v16+)
- [ ] npm installed
- [ ] MongoDB Atlas account created
- [ ] Google Cloud account with OAuth credentials
- [ ] Git installed (optional, for version control)

## 🔧 Setup (First Time Only)

### Step 1: Google OAuth Setup (5 minutes)
- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Copy Client ID and Secret

### Step 2: MongoDB Setup (10 minutes)
- [ ] Create MongoDB Atlas cluster
- [ ] Create database user
- [ ] Get connection string
- [ ] Add IP whitelist (0.0.0.0/0 for development)

### Step 3: Clone & Install (10 minutes)
```bash
cd mclub
cd server && npm install && cd ..
cd client && npm install && cd ..
```
- [ ] Server dependencies installed
- [ ] Client dependencies installed

### Step 4: Configure Environment (5 minutes)
**Backend (.env)**
```bash
cd server
cp .env.example .env
# Edit .env with:
# MONGODB_URI=your_mongodb_uri
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# JWT_SECRET=random_secret_key
```

**Frontend (.env)**
```bash
cd ../client
cp .env.example .env
# Edit .env with:
# VITE_GOOGLE_CLIENT_ID=your_client_id
```

- [ ] Backend .env configured
- [ ] Frontend .env configured

## ▶️ Running the Application (Every Time)

### Terminal 1 - Backend
```bash
cd mclub/server
npm run dev
# Should see: "Server running on port 5000"
```
- [ ] Backend running on port 5000

### Terminal 2 - Frontend
```bash
cd mclub/client
npm run dev
# Should see: "http://localhost:3000"
# Browser should open automatically
```
- [ ] Frontend running on port 3000
- [ ] Browser opened automatically

## ✅ Verify Everything Works

### Test User Flow
1. [ ] Homepage loads
2. [ ] Click "Get Started"
3. [ ] Google login appears
4. [ ] Sign in with Google account
5. [ ] Redirected to workshops page
6. [ ] Profile shows in navbar
7. [ ] Click logout works

### Test Admin Flow
1. [ ] Sign in as admin (change isAdmin to true in MongoDB)
2. [ ] Click "Admin" in navbar
3. [ ] Click "Create Workshop"
4. [ ] Fill in workshop details
5. [ ] Add at least one form field
6. [ ] Upload a cover image
7. [ ] Click "Create Workshop"
8. [ ] Workshop appears on dashboard

### Test Registration Flow
1. [ ] Sign in as regular user
2. [ ] Go to "Workshops"
3. [ ] Click a workshop
4. [ ] Click "Register Now"
5. [ ] Fill form fields
6. [ ] Submit registration
7. [ ] Redirected to "My Events"
8. [ ] Registration appears in list

### Test Export
1. [ ] As admin, go to "Admin" dashboard
2. [ ] Click "Registrations" on any workshop
3. [ ] Click "Export to Excel"
4. [ ] .xlsx file downloads
5. [ ] File opens properly

## 🐛 Troubleshooting Quick Fixes

### Backend Won't Start
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Error
1. Check MONGODB_URI in .env
2. Verify IP whitelist in MongoDB Atlas
3. Ensure cluster is running
4. Check username/password

### Google Login Not Working
1. Check GOOGLE_CLIENT_ID in .env files
2. Verify origins in Google Cloud Console
3. Clear browser cookies/cache
4. Open console (F12) for errors

### Frontend Can't Reach Backend
1. Check VITE_API_URL in client/.env
2. Verify backend is running on port 5000
3. Check CORS configuration
4. Check Network tab in DevTools

### Upload Image Not Working
1. Check file size (max 10MB)
2. Verify file type (JPG, PNG, GIF, WebP)
3. Check uploads folder exists
4. Check file permissions

## 📝 Useful Commands

```bash
# Kill all Node processes
pkill node

# Check ports in use (Windows)
netstat -ano

# Check ports in use (Mac/Linux)
lsof -i

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build frontend for production
cd client
npm run build

# View build preview
npm run preview
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `/server/.env` | Backend configuration |
| `/client/.env` | Frontend configuration |
| `/server/server.js` | Backend entry point |
| `/client/src/App.jsx` | Frontend entry point |
| `/README.md` | Project overview |
| `/SETUP.md` | Detailed setup guide |
| `/API_REFERENCE.md` | API documentation |

## 🔗 Quick Links

- [Main README](./README.md) - Full documentation
- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [API Reference](./API_REFERENCE.md) - All API endpoints
- [Server README](./server/README.md) - Backend details
- [Client README](./client/README.md) - Frontend details

## 🚀 Next Steps

1. **Test all features** using the checklist above
2. **Customize** colors, text, and branding
3. **Add more form fields** to registration forms
4. **Create more workshops** to populate database
5. **Test on mobile** for responsiveness
6. **Deploy** to production when ready

## 💡 Pro Tips

1. **Enable multiple admin accounts**: Add more users and set `isAdmin: true` in MongoDB
2. **Create test data**: Add sample workshops before demoing
3. **Check logs**: Look at terminal output for detailed error messages
4. **Use Postman**: Test API endpoints with Postman collection
5. **DevTools**: Use F12 in browser to debug frontend issues
6. **MongoDB Compass**: Use to view and manage database
7. **Git workflow**: Commit changes regularly for version control

## 📊 Project Statistics

- **Frontend**: React components (~1500 lines)
- **Backend**: Node.js/Express (~800 lines)
- **Database**: 3 MongoDB collections
- **API Endpoints**: 16 routes
- **Responsive**: Mobile, tablet, desktop
- **Features**: 20+ major features

## 🎯 Features Summary

### ✨ User Portal
- Google OAuth login
- Browse and search workshops
- View workshop details
- Register with dynamic forms
- Manage registrations
- Responsive design

### ⚙️ Admin Portal
- Create/edit/delete workshops
- Upload cover images
- Dynamic form builder
- View registrations
- Export to Excel
- Workshop status management

## 📞 Support Resources

1. Read the README files
2. Check API_REFERENCE.md for endpoint details
3. Review error messages in console
4. Check troubleshooting section
5. Verify environment configuration

## ✨ You're Ready!

If you've completed all checklist items above:
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000
- ✅ All features tested
- ✅ Configuration complete

**You're ready to build amazing workshops! 🎉**

---

**Questions?** Check the detailed documentation files in the project root.
