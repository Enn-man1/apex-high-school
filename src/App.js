// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageClasses from './pages/admin/ManageClasses';
import ReportsPage from './pages/admin/ReportsPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MarkAttendance from './pages/teacher/MarkAttendance';
import ManageGrades from './pages/teacher/ManageGrades';
import StudentDashboard from './pages/student/StudentDashboard';
import MyGrades from './pages/student/MyGrades';
import MyAttendance from './pages/student/MyAttendance';
import ParentDashboard from './pages/parent/ParentDashboard';
import AnnouncementsPage from './pages/shared/AnnouncementsPage';
import TimetablePage from './pages/shared/TimetablePage';
import FeesPage from './pages/shared/FeesPage';
import AssignmentsPage from './pages/shared/AssignmentsPage';
import MessagesPage from './pages/shared/MessagesPage';
import ProfilePage from './pages/shared/ProfilePage';
import GalleryPage from './pages/landing/Gallery';
import ManageTimetable from './pages/admin/ManageTimetable';

// Protected route
function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: '#0D1B3E',
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
        <div style={{ fontSize: 18, opacity: 0.7 }}>Loading...</div>
      </div>
    </div>
  );

  if (!user || !profile) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={`/${profile.role}`} replace />;
  }

  return children;
}

// Role based home redirect
function HomeRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user || !profile) return <Navigate to="/login" replace />;
  return <Navigate to={`/${profile.role}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomeRedirect />} />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageStudents />
        </ProtectedRoute>
      } />
      <Route path="/admin/teachers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageTeachers />
        </ProtectedRoute>
      } />
      <Route path="/admin/classes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageClasses />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ReportsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/announcements" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AnnouncementsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/fees" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <FeesPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/messages" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/profile" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Teacher */}
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      <Route path="/teacher/attendance" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <MarkAttendance />
        </ProtectedRoute>
      } />
      <Route path="/teacher/grades" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <ManageGrades />
        </ProtectedRoute>
      } />
      <Route path="/teacher/assignments" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <AssignmentsPage />
        </ProtectedRoute>
      } />
      <Route path="/teacher/timetable" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TimetablePage />
        </ProtectedRoute>
      } />
      <Route path="/teacher/announcements" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <AnnouncementsPage />
        </ProtectedRoute>
      } />
      <Route path="/teacher/messages" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/teacher/profile" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Student */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/grades" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MyGrades />
        </ProtectedRoute>
      } />
      <Route path="/student/attendance" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MyAttendance />
        </ProtectedRoute>
      } />
      <Route path="/student/assignments" element={
        <ProtectedRoute allowedRoles={['student']}>
          <AssignmentsPage />
        </ProtectedRoute>
      } />
      <Route path="/student/timetable" element={
        <ProtectedRoute allowedRoles={['student']}>
          <TimetablePage />
        </ProtectedRoute>
      } />
      <Route path="/student/fees" element={
        <ProtectedRoute allowedRoles={['student']}>
          <FeesPage />
        </ProtectedRoute>
      } />
      <Route path="/student/messages" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Parent */}
      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <ParentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/parent/grades" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <MyGrades />
        </ProtectedRoute>
      } />
      <Route path="/parent/fees" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <FeesPage />
        </ProtectedRoute>
      } />
      <Route path="/parent/timetable" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <TimetablePage />
        </ProtectedRoute>
      } />
      <Route path="/parent/announcements" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <AnnouncementsPage />
        </ProtectedRoute>
      } />
      <Route path="/parent/messages" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/parent/profile" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/gallery" element={<GalleryPage />} />

      <Route path="/admin/timetable" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageTimetable />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0D1B3E',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 20px',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}