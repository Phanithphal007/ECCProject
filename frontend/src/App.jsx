import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ParentLayout } from './layouts/ParentLayout';
import { StudentLayout } from './layouts/StudentLayout';

// Public Views
import { HomePage } from './views/public/HomePage';
import { AboutPage } from './views/public/AboutPage';
import { CoursesPage } from './views/public/CoursesPage';
import { CourseDetailsPage } from './views/public/CourseDetailsPage';
import { PricingPage } from './views/public/PricingPage';
import { PublicTeachersPage } from './views/public/PublicTeachersPage';
import { ContactPage } from './views/public/ContactPage';
import { EnrollmentInquiryPage } from './views/public/EnrollmentInquiryPage';

// Auth Views
import { LoginPage } from './views/auth/LoginPage';
import { RegisterPage } from './views/auth/RegisterPage';
import { ForgotPasswordPage } from './views/auth/ForgotPasswordPage';
import { VerifyOtpPage } from './views/auth/VerifyOtpPage';
import { ResetPasswordPage } from './views/auth/ResetPasswordPage';

// Loading Skeleton
import { LoadingSkeleton } from './components/ui/LoadingSkeleton';

// Code-split all Admin & Portal views for fast loading
const AdminDashboard = lazy(() => import('./views/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const StudentsView = lazy(() => import('./views/StudentsView').then((m) => ({ default: m.StudentsView })));
const StudentScoresView = lazy(() => import('./views/StudentScoresView').then((m) => ({ default: m.StudentScoresView })));
const TeachersView = lazy(() => import('./views/TeachersView').then((m) => ({ default: m.TeachersView })));
const TeacherSchedulesView = lazy(() => import('./views/TeacherSchedulesView').then((m) => ({ default: m.TeacherSchedulesView })));
const ClassesView = lazy(() => import('./views/ClassesView').then((m) => ({ default: m.ClassesView })));
const SubjectsView = lazy(() => import('./views/SubjectsView').then((m) => ({ default: m.SubjectsView })));
const SubjectClassesView = lazy(() => import('./views/SubjectClassesView').then((m) => ({ default: m.SubjectClassesView })));
const ClassStudentsView = lazy(() => import('./views/ClassStudentsView').then((m) => ({ default: m.ClassStudentsView })));
const ClassAttendanceView = lazy(() => import('./views/ClassAttendanceView').then((m) => ({ default: m.ClassAttendanceView })));
const ActivitiesView = lazy(() => import('./views/ActivitiesView').then((m) => ({ default: m.ActivitiesView })));
const AttendanceView = lazy(() => import('./views/AttendanceView').then((m) => ({ default: m.AttendanceView })));
const HomeworkView = lazy(() => import('./views/HomeworkView').then((m) => ({ default: m.HomeworkView })));
const AssessmentsView = lazy(() => import('./views/AssessmentsView').then((m) => ({ default: m.AssessmentsView })));
const EvaluationsView = lazy(() => import('./views/EvaluationsView').then((m) => ({ default: m.EvaluationsView })));
const FinancialsView = lazy(() => import('./views/FinancialsView').then((m) => ({ default: m.FinancialsView })));
const ReportsView = lazy(() => import('./views/ReportsView').then((m) => ({ default: m.ReportsView })));
const UsersView = lazy(() => import('./views/UsersView').then((m) => ({ default: m.UsersView })));
const SettingsView = lazy(() => import('./views/SettingsView').then((m) => ({ default: m.SettingsView })));
const ParentPortalView = lazy(() => import('./views/ParentPortalView').then((m) => ({ default: m.ParentPortalView })));
const StudentPortalView = lazy(() => import('./views/StudentPortalView').then((m) => ({ default: m.StudentPortalView })));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* 1. Public Website Experience */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/teachers" element={<PublicTeachersPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/enrollment" element={<EnrollmentInquiryPage />} />
            </Route>

            {/* 2. Authentication Flow */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* 3. Admin Dashboard Experience */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<StudentsView />} />
              <Route path="students/:studentId/scores" element={<StudentScoresView />} />
              <Route path="teachers" element={<TeachersView />} />
              <Route path="teacher-schedules" element={<TeacherSchedulesView />} />
              <Route path="classes" element={<ClassesView />} />
              <Route path="classes/:classId" element={<ClassStudentsView />} />
              <Route path="classes/:classId/students" element={<ClassStudentsView />} />
              <Route path="classes/:classId/attendance" element={<ClassAttendanceView />} />
              <Route path="subjects" element={<SubjectsView />} />
              <Route path="subjects/:subjectId/classes" element={<SubjectClassesView />} />
              <Route path="activities" element={<ActivitiesView />} />
              <Route path="attendance" element={<ClassAttendanceView />} />
              <Route path="homework" element={<HomeworkView />} />
              <Route path="assessments" element={<AssessmentsView />} />
              <Route path="evaluations" element={<EvaluationsView />} />
              <Route path="financials" element={<FinancialsView />} />
              <Route path="reports" element={<ReportsView />} />
              <Route path="users" element={<UsersView />} />
              <Route path="settings" element={<SettingsView />} />
              {/* Fallback inside admin */}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* 4. Parent Portal Experience */}
            <Route path="/parent" element={<ParentLayout />}>
              <Route index element={<Navigate to="/parent/dashboard" replace />} />
              <Route path="dashboard" element={<ParentPortalView />} />
              <Route path="overview" element={<ParentPortalView />} />
              <Route path="classes" element={<ParentPortalView />} />
              <Route path="timetable" element={<ParentPortalView />} />
              <Route path="attendance" element={<ParentPortalView />} />
              <Route path="activities" element={<ParentPortalView />} />
              <Route path="homework" element={<ParentPortalView />} />
              <Route path="evaluations" element={<ParentPortalView />} />
              <Route path="billing" element={<ParentPortalView />} />
              <Route path="announcements" element={<ParentPortalView />} />
              <Route path="*" element={<ParentPortalView />} />
            </Route>

            {/* 5. Student Portal Experience */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentPortalView />} />
              <Route path="overview" element={<StudentPortalView />} />
              <Route path="classes" element={<StudentPortalView />} />
              <Route path="timetable" element={<StudentPortalView />} />
              <Route path="attendance" element={<StudentPortalView />} />
              <Route path="homework" element={<StudentPortalView />} />
              <Route path="evaluations" element={<StudentPortalView />} />
              <Route path="rewards" element={<StudentPortalView />} />
              <Route path="tuition" element={<StudentPortalView />} />
              <Route path="announcements" element={<StudentPortalView />} />
              <Route path="*" element={<StudentPortalView />} />
            </Route>

            {/* General fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
