import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PrivateRoute } from './components/PrivateRoute';
import { SupportMailButton } from './components/SupportMailButton';
import { Footer } from './components/Footer';
import { LoadingSpinner } from './components/UI';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { WorkshopsPage } from './pages/WorkshopsPage';
import { WorkshopDetailPage } from './pages/WorkshopDetailPage';
import { WorkshopRegistrationPage } from './pages/WorkshopRegistrationPage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RegistrationsPage } from './pages/RegistrationsPage';
import { PaymentScreenshotPage } from './pages/PaymentScreenshotPage';
import { WorkshopFormPage } from './pages/WorkshopFormPage';
import { AdminAuthPage } from './pages/AdminAuthPage';
import { TakeAttendancePage } from './pages/TakeAttendancePage';
import { AttendanceReportsPage } from './pages/AttendanceReportsPage';
import { BlogsPage } from './pages/BlogsPage';
import { BlogEditorPage } from './pages/BlogEditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { DesignShowcasePage } from './pages/DesignShowcasePage';
import { CodeBlockTestPage } from './pages/CodeBlockTestPage';
import { QRCheckInPage } from './pages/QRCheckInPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { HighlightDetailPage } from './pages/HighlightDetailPage';
import { AdminAchievementsPage } from './pages/AdminAchievementsPage';
import { AdminCertificatesPage } from './pages/AdminCertificatesPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { EntryPassPage } from './pages/EntryPassPage';
import { AdminEntryPage } from './pages/AdminEntryPage';
import { AdminHackathonEvaluationPage } from './pages/AdminHackathonEvaluationPage';
import { AdminHackathonTeamEvaluationPage } from './pages/AdminHackathonTeamEvaluationPage';
import { HackathonLeaderboardPage } from './pages/HackathonLeaderboardPage';
import { AdminHackathonsPage } from './pages/AdminHackathonsPage';
import { AdminHackathonProblemStatementsPage } from './pages/AdminHackathonProblemStatementsPage';
import { HackathonProblemStatementsPage } from './pages/HackathonProblemStatementsPage';
import { AdminProblemStatementSelectionsPage } from './pages/AdminProblemStatementSelectionsPage';

// Styles
import './styles/globals.css';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (pathname === '/achievements' && new URLSearchParams(search).has('highlight')) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
};

const AppContent = () => {
  const { loading } = useAuth();
  const location = useLocation();
  const hideGlobalFooter = location.pathname.startsWith('/admin') || location.pathname.startsWith('/attendance/check-in');
  const useBlogHeaderOnly = location.pathname === '/blogs';

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app-root flex min-h-screen flex-col bg-white">
      <ScrollToTop />
      {!useBlogHeaderOnly && <Navbar />}
      <main className={`flex-1 ${useBlogHeaderOnly ? '' : 'pt-16 sm:pt-20'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/design" element={<DesignShowcasePage />} />
          <Route path="/code-test" element={<CodeBlockTestPage />} />
          <Route path="/MC-ADMIN" element={<AdminAuthPage />} />
          <Route path="/mc-admin" element={<Navigate to="/MC-ADMIN" replace />} />
          <Route path="/workshops" element={<WorkshopsPage />} />
          <Route path="/workshop/:id" element={<WorkshopDetailPage />} />
          <Route
            path="/workshop/:id/register"
            element={
              <PrivateRoute>
                <WorkshopRegistrationPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/blogs"
            element={
              <PrivateRoute>
                <BlogsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/blogs/create"
            element={
              <PrivateRoute>
                <BlogEditorPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/blogs/:postId/edit"
            element={
              <PrivateRoute>
                <BlogEditorPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/:userId"
            element={
              <PrivateRoute>
                <UserProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="/attendance/check-in/:workshopId" element={<QRCheckInPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/achievements/:highlightId" element={<HighlightDetailPage />} />
          <Route
            path="/entry-pass/:registrationId"
            element={
              <PrivateRoute>
                <EntryPassPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/hackathon/:workshopId/leaderboard"
            element={
              <PrivateRoute>
                <HackathonLeaderboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/hackathon/:workshopId/problem-statements"
            element={
              <PrivateRoute>
                <HackathonProblemStatementsPage />
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
            path="/admin/registrations/:workshopId/payment/:registrationId"
            element={
              <PrivateRoute requireAdmin={true}>
                <PaymentScreenshotPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/registrations/:workshopId/image/:registrationId/:imageKey"
            element={
              <PrivateRoute requireAdmin={true}>
                <PaymentScreenshotPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/workshops/new"
            element={
              <PrivateRoute requireAdmin={true}>
                <WorkshopFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/hackathons"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminHackathonsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/hackathons/new"
            element={
              <PrivateRoute requireAdmin={true}>
                <WorkshopFormPage defaultEventType="hackathon" allowedEventTypes={['hackathon']} />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/workshops/:workshopId/edit"
            element={
              <PrivateRoute requireAdmin={true}>
                <WorkshopFormPage />
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
          <Route
            path="/admin/entry/:workshopId"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminEntryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/hackathon/:workshopId/evaluation"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminHackathonEvaluationPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/hackathon/:workshopId/problem-statements"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminHackathonProblemStatementsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/hackathon/:workshopId/problem-statements/selections"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminProblemStatementSelectionsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/hackathon/:workshopId/evaluation/:registrationId"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminHackathonTeamEvaluationPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/achievements"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminAchievementsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminAnalyticsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/certificates/:workshopId"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminCertificatesPage />
              </PrivateRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideGlobalFooter && <Footer />}
      <SupportMailButton />
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
