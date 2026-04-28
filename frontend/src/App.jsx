import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import RoleGuard from "./components/RoleGuard";
import FloatingChatWidget from "./components/FloatingChatWidget";
import { getToken } from "./utils/auth";

// ── Student Pages (lazy) ────────────────────────────────────────────────────
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const LeavePage = lazy(() => import("./pages/LeavePage"));
const TimetablePage = lazy(() => import("./pages/TimetablePage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const AnonChatPage = lazy(() => import("./pages/AnonChatPage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const PollsPage = lazy(() => import("./pages/PollsPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));
const SyllabusPage = lazy(() => import("./pages/SyllabusPage"));
const FacultyPage = lazy(() => import("./pages/FacultyPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const LostFoundPage = lazy(() => import("./pages/LostFoundPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const ExamsPage = lazy(() => import("./pages/ExamsPage"));
const GPAPage = lazy(() => import("./pages/GPAPage"));
const FeesPage = lazy(() => import("./pages/FeesPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const PlacementPage = lazy(() => import('./pages/PlacementPage'));
const SettingsPage  = lazy(() => import('./pages/SettingsPage'));

// ── Hub Pages (v4 category landing) ─────────────────────────────────────────
const AcademicsHub = lazy(() => import("./pages/hubs/AcademicsHub"));
const PerformanceHub = lazy(() => import("./pages/hubs/PerformanceHub"));
const CampusHub = lazy(() => import("./pages/hubs/CampusHub"));
const ServicesHub = lazy(() => import("./pages/hubs/ServicesHub"));

// ── Faculty Pages (lazy) ────────────────────────────────────────────────────
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyDashboard"));
const FacultyAttendance = lazy(() => import("./pages/faculty/FacultyAttendance"));
const FacultyMarks = lazy(() => import("./pages/faculty/FacultyMarks"));
const FacultyAmendments = lazy(() => import("./pages/faculty/FacultyAmendments"));
const FacultyLeaves = lazy(() => import("./pages/faculty/FacultyLeaves"));

// ── Admin Pages (lazy) ──────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"));

// ── Suspense Fallback ───────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-card">
        <h2>Studvisor</h2>
        <p>Loading module...</p>
      </div>
    </div>
  );
}

// ── Protected Route Wrapper ─────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const contextPage = getContextPage(location.pathname);
  return (
    <RoleGuard allowedRoles={allowedRoles}>
      {children}
      <FloatingChatWidget contextPage={contextPage} />
    </RoleGuard>
  );
}

// ── Complete Context Page Mapping ───────────────────────────────────────────
function getContextPage(pathname) {
  if (pathname.startsWith("/attendance")) return "attendance";
  if (pathname.startsWith("/results")) return "results";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/leave")) return "leave";
  if (pathname.startsWith("/timetable")) return "timetable";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/campus-wall")) return "campus_wall";
  if (pathname.startsWith("/hub")) return "hub";
  if (pathname.startsWith("/polls")) return "polls";
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/assignments")) return "assignments";
  if (pathname.startsWith("/syllabus")) return "syllabus";
  if (pathname.startsWith("/faculty/dashboard")) return "faculty_dashboard";
  if (pathname.startsWith("/faculty/attendance")) return "faculty_attendance";
  if (pathname.startsWith("/faculty/marks")) return "faculty_marks";
  if (pathname.startsWith("/faculty/amendments")) return "faculty_amendments";
  if (pathname.startsWith("/faculty/leaves")) return "faculty_leaves";
  if (pathname.startsWith("/faculty")) return "faculty";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/lost-found")) return "lost_found";
  if (pathname.startsWith("/notes")) return "notes";
  if (pathname.startsWith("/achievements")) return "achievements";
  if (pathname.startsWith("/announcements")) return "announcements";
  if (pathname.startsWith("/exams")) return "exams";
  if (pathname.startsWith("/gpa")) return "gpa";
  if (pathname.startsWith("/fees")) return "fees";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/placement")) return "placement";
  if (pathname.startsWith("/admin/dashboard")) return "admin_dashboard";
  if (pathname.startsWith("/admin/students")) return "admin_students";
  if (pathname.startsWith("/admin/analytics")) return "admin_analytics";
  if (pathname.startsWith("/admin/audit")) return "admin_audit";
  if (pathname.startsWith("/admin")) return "admin";
  return "dashboard";
}

export default function App() {
  const token = getToken();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Hub Routes (v4) */}
          <Route path="/academics" element={<ProtectedRoute allowedRoles={["student"]}><AcademicsHub /></ProtectedRoute>} />
          <Route path="/performance" element={<ProtectedRoute allowedRoles={["student"]}><PerformanceHub /></ProtectedRoute>} />
          <Route path="/campus" element={<ProtectedRoute allowedRoles={["student"]}><CampusHub /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute allowedRoles={["student"]}><ServicesHub /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><DashboardPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute allowedRoles={["student"]}><AttendancePage /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute allowedRoles={["student"]}><ResultsPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute allowedRoles={["student"]}><CalendarPage /></ProtectedRoute>} />
          <Route path="/leave" element={<ProtectedRoute allowedRoles={["student"]}><LeavePage /></ProtectedRoute>} />
          <Route path="/timetable" element={<ProtectedRoute allowedRoles={["student", "faculty", "hod"]}><TimetablePage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={["student"]}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/campus-wall" element={<ProtectedRoute allowedRoles={["student"]}><AnonChatPage /></ProtectedRoute>} />
          <Route path="/hub" element={<ProtectedRoute allowedRoles={["student"]}><FeaturesPage /></ProtectedRoute>} />
          <Route path="/polls" element={<ProtectedRoute allowedRoles={["student"]}><PollsPage /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute allowedRoles={["student"]}><EventsPage /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute allowedRoles={["student"]}><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/syllabus" element={<ProtectedRoute allowedRoles={["student"]}><SyllabusPage /></ProtectedRoute>} />
          <Route path="/faculty" element={<ProtectedRoute allowedRoles={["student"]}><FacultyPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute allowedRoles={["student"]}><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/lost-found" element={<ProtectedRoute allowedRoles={["student"]}><LostFoundPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute allowedRoles={["student"]}><NotesPage /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute allowedRoles={["student"]}><AchievementsPage /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute allowedRoles={["student", "faculty", "hod", "admin"]}><AnnouncementsPage /></ProtectedRoute>} />
          <Route path="/exams" element={<ProtectedRoute allowedRoles={["student"]}><ExamsPage /></ProtectedRoute>} />
          <Route path="/gpa" element={<ProtectedRoute allowedRoles={["student"]}><GPAPage /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute allowedRoles={["student"]}><FeesPage /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute allowedRoles={["student"]}><LibraryPage /></ProtectedRoute>} />
          <Route path="/placement" element={<ProtectedRoute allowedRoles={["student"]}><PlacementPage /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute allowedRoles={["student","faculty","hod","admin"]}><SettingsPage /></ProtectedRoute>} />


          {/* Faculty Routes */}
          <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={["faculty", "hod"]}><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={["faculty", "hod"]}><FacultyAttendance /></ProtectedRoute>} />
          <Route path="/faculty/marks" element={<ProtectedRoute allowedRoles={["faculty", "hod"]}><FacultyMarks /></ProtectedRoute>} />
          <Route path="/faculty/amendments" element={<ProtectedRoute allowedRoles={["hod"]}><FacultyAmendments /></ProtectedRoute>} />
          <Route path="/faculty/leaves" element={<ProtectedRoute allowedRoles={["faculty", "hod"]}><FacultyLeaves /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAudit /></ProtectedRoute>} />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '6rem', margin: 0, color: 'var(--accent, #6366f1)' }}>404</h1>
      <h2 style={{ margin: 0 }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: 'var(--accent, #6366f1)', color: 'white', fontWeight: 'bold', textDecoration: 'none' }}>Back to Dashboard</Link>
    </div>
  );
}
