import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PrivateRoute } from './components/PrivateRoute';
import { LoadingSpinner } from './components/UI';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { WorkshopsPage } from './pages/WorkshopsPage';
import { WorkshopDetailPage } from './pages/WorkshopDetailPage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RegistrationsPage } from './pages/RegistrationsPage';
import { AdminAuthPage } from './pages/AdminAuthPage';
import { TakeAttendancePage } from './pages/TakeAttendancePage';
import { AttendanceReportsPage } from './pages/AttendanceReportsPage';
import { BlogsPage } from './pages/BlogsPage';

// Styles
import './styles/globals.css';

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/MC-ADMIN" element={<AdminAuthPage />} />
          <Route path="/mc-admin" element={<Navigate to="/MC-ADMIN" replace />} />
          <Route path="/workshops" element={<WorkshopsPage />} />
          <Route path="/workshop/:id" element={<WorkshopDetailPage />} />
          <Route
            path="/blogs"
            element={
              <PrivateRoute>
                <BlogsPage />
              </PrivateRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/my-registrations"
            element={
              <PrivateRoute>
                <MyRegistrationsPage />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/registrations/:workshopId"
            element={
              <PrivateRoute requireAdmin={true}>
                <RegistrationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/attendance/:workshopId"
            element={
              <PrivateRoute requireAdmin={true}>
                <TakeAttendancePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/attendance/:workshopId/reports"
            element={
              <PrivateRoute requireAdmin={true}>
                <AttendanceReportsPage />
              </PrivateRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <AppContent />
          </Suspense>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
