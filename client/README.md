# MongoDB Workshop Registration System - Frontend Setup Guide

## 🚀 Quick Start

### Installation

```bash
cd client
npm install
cp .env.example .env
```

### Configuration

Edit `.env` and add your values:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Running the Application

```bash
npm run dev
```

Frontend will run on `http://localhost:3000` and open automatically in your browser.

## 🏗️ Project Structure

```
client/
├── public/
│   └── index.html              # Main HTML file
├── src/
│   ├── components/             # Reusable components
│   │   ├── Navbar.jsx         # Navigation bar
│   │   ├── PrivateRoute.jsx    # Protected route wrapper
│   │   ├── UI.jsx             # UI utilities (Spinner, Error, Success)
│   │   ├── WorkshopCard.jsx    # Workshop card component
│   │   ├── RegistrationForm.jsx # Dynamic registration form
│   │   ├── FormBuilder.jsx     # Admin form builder
│   │   ├── AdminWorkshopCard.jsx # Admin workshop card
│   │   ├── RegistrationsTable.jsx # Registrations table
│   │   └── CreateWorkshopModal.jsx # Create/edit workshop modal
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context (Redux-like)
│   ├── pages/                  # Page components
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── LoginPage.jsx       # Google login page
│   │   ├── WorkshopsPage.jsx   # All workshops list
│   │   ├── WorkshopDetailPage.jsx # Workshop details
│   │   ├── MyRegistrationsPage.jsx # User registrations
│   │   ├── AdminDashboard.jsx  # Admin dashboard
│   │   └── RegistrationsPage.jsx # Workshop registrations (admin)
│   ├── utils/
│   │   └── api.js              # API client using Axios
│   ├── styles/
│   │   └── globals.css         # Global styles
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── postcss.config.js           # PostCSS configuration
```

## 🎨 Key Components

### Navbar
Navigation component with:
- Logo and branding
- Home, Workshops, My Events, Admin links
- User profile display
- Logout button
- Mobile-responsive hamburger menu

### PrivateRoute
Protected route wrapper that:
- Redirects unauthenticated users to login
- Requires admin role for admin routes
- Shows loading spinner during auth check

### WorkshopCard
Displays workshop information:
- Cover image
- Title and description
- Date, time, venue
- Registration count
- "View Details" button

### RegistrationForm
Modal form for workshop registration:
- Dynamic fields based on admin configuration
- Support for different input types
- Form validation
- Error handling
- Submit functionality

### FormBuilder
Admin tool for creating registration forms:
- Add fields with different types
- Set required/optional
- Configure options for dropdowns/radio/checkbox
- Reorder fields
- Remove fields

### CreateWorkshopModal
Modal for creating/editing workshops:
- Workshop details (title, description, etc.)
- Image upload
- Form builder integration
- Submit and cancel buttons

## 📚 Context API - AuthContext

Manages global authentication state:

```javascript
useAuth() // Hook to access auth state
// Returns:
{
  user,                    // Current user object
  token,                   // JWT token
  loading,                 // Auth loading state
  isAuthenticated,         // Boolean
  isAdmin,                 // Boolean
  handleGoogleLoginSuccess,// Function
  logout                   // Function
}
```

## 🔌 API Client (utils/api.js)

Organized API calls by resource:

### workshopAPI
- `getAllWorkshops()` - Fetch all workshops
- `getWorkshopById(id)` - Fetch specific workshop
- `createWorkshop(data)` - Create new workshop
- `updateWorkshop(id, data)` - Update workshop
- `deleteWorkshop(id)` - Delete workshop
- `getAdminWorkshops()` - Get user's workshops
- `toggleWorkshopStatus(id)` - Toggle active status

### registrationAPI
- `registerForWorkshop(data)` - Register for workshop
- `getUserRegistrations()` - Get user's registrations
- `getWorkshopRegistrations(workshopId)` - Get workshop registrations
- `cancelRegistration(registrationId)` - Cancel registration
- `deleteRegistration(registrationId, workshopId)` - Delete registration
- `exportRegistrations(workshopId)` - Export to Excel

## 🎯 Pages Overview

### HomePage
Landing page with:
- Hero section with CTA
- Features showcase
- About club section
- Stats display
- Call to action buttons

### LoginPage
Google OAuth login with:
- Clean centered design
- Google Sign-In button
- Error message display
- Terms notice

### WorkshopsPage
List all workshops with:
- Search functionality
- Filter by title/description/venue
- Grid of workshop cards
- Click to view details

### WorkshopDetailPage
Full workshop details with:
- Large cover image
- Complete workshop info
- Meta information (date, time, venue)
- Description
- Register button
- Registration form modal

### MyRegistrationsPage
User's registrations with:
- List of all registrations
- Registration status
- Workshop details
- Submitted form data
- Cancel registration button

### AdminDashboard
Admin management interface with:
- Create workshop button
- Grid of admin workshop cards
- Quick actions (Edit, View Registrations, Export, Delete)
- Create workshop modal

### RegistrationsPage
View workshop registrations with:
- Workshop details
- Registrations table
- User information
- Delete registration option
- Export to Excel button

## 🎨 Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom colors (primary: #4f46e5, secondary: #06b6d4)
- Responsive design utilities
- Dark mode ready (easily customizable)

### Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 🔒 Authentication Flow

1. User clicks Google Sign-In button
2. Google OAuth popup opens
3. User signs in with Google
4. Google returns credential token
5. Frontend sends token to backend
6. Backend verifies and returns JWT
7. JWT stored in localStorage
8. User profile fetched and stored in context
9. User redirected to workshops page

## 🚀 Build for Production

```bash
npm run build    # Creates optimized build in dist/
npm run preview  # Preview production build locally
```

## 📱 Responsive Design

The application is fully responsive:
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly buttons
- Mobile navigation menu
- Responsive images
- Flexible forms

## 🐛 Debugging

### Check Authentication
```javascript
// In browser console
localStorage.getItem('authToken')
```

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Check requests to API
4. View response data

### Common Issues

#### Login not working
- Check VITE_GOOGLE_CLIENT_ID in .env
- Verify Google OAuth setup
- Check browser console for errors

#### API calls failing
- Verify VITE_API_URL points to backend
- Check backend is running
- Check CORS configuration
- Verify token in localStorage

#### Styling issues
- Clear browser cache
- Verify Tailwind CSS build
- Check postcss.config.js

## 📦 Dependencies

### Core
- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Client-side routing

### HTTP & Data
- `axios` - HTTP client

### Authentication
- `@react-oauth/google` - Google OAuth integration

### Styling
- `tailwindcss` - Utility CSS framework
- `autoprefixer` - CSS vendor prefixes

### Icons
- `react-icons` - Icon library

### Build Tools
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `postcss` - CSS processing
- `autoprefixer` - CSS prefixer

## 🌍 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |
| VITE_GOOGLE_CLIENT_ID | Google OAuth Client ID | 1234567890-abcd.apps.googleusercontent.com |

## 💡 Tips & Best Practices

1. **Use hooks properly** - Always use auth context in functional components
2. **Error handling** - Display user-friendly error messages
3. **Loading states** - Show loaders during async operations
4. **Form validation** - Validate before submission
5. **Image optimization** - Keep image sizes reasonable
6. **Mobile first** - Test on mobile while developing

## 🔗 Links

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

## 🚀 Deployment

For production deployment:

1. Build the app: `npm run build`
2. Deploy `dist/` folder to hosting (Vercel, Netlify, GitHub Pages, etc.)
3. Set environment variables on hosting platform
4. Update VITE_API_URL to production backend
5. Ensure Google OAuth credentials are updated

## 📞 Support

For issues:
1. Check browser console
2. Open DevTools Network tab
3. Verify API connectivity
4. Check .env configuration
5. Review error messages

---

**Happy Coding! 🎉**
