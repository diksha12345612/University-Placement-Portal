import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getDashboardPath } from './utils/roleRoutes'

import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import DashboardLayout from './components/DashboardLayout'
import Spinner from './components/Spinner'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/StudentProfile'
import Jobs from './pages/student/Jobs'
import JobDetails from './pages/student/JobDetails'
import MyApplications from './pages/student/MyApplications'
import Drives from './pages/student/Drives'
import MockTests from './pages/student/MockTests'
import TakeTest from './pages/student/TakeTest'
import TestResult from './pages/student/TestResult'
import MockInterviews from './pages/student/MockInterviews'
import InterviewSession from './pages/student/InterviewSession'
import AiAssistant from './pages/student/AiAssistant'
import InterviewPrep from './pages/student/InterviewPrep'
// Recruiter and admin pages (and the big chart library on the admin dashboard) are split into
// separate files with lazy(). They download only when someone opens them, so students load faster.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard'))
const MyJobs = lazy(() => import('./pages/recruiter/MyJobs'))
const JobEditor = lazy(() => import('./pages/recruiter/JobEditor'))
const Applicants = lazy(() => import('./pages/recruiter/Applicants'))
const ManageRecruiters = lazy(() => import('./pages/admin/ManageRecruiters'))
const ManageJobs = lazy(() => import('./pages/admin/ManageJobs'))
const Students = lazy(() => import('./pages/admin/Students'))
const StudentDetail = lazy(() => import('./pages/admin/StudentDetail'))
const ManageDrives = lazy(() => import('./pages/admin/ManageDrives'))
const ManageAnnouncements = lazy(() => import('./pages/admin/ManageAnnouncements'))
const ManageMockTests = lazy(() => import('./pages/admin/ManageMockTests'))
const MockTestEditor = lazy(() => import('./pages/admin/MockTestEditor'))
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'


// "/" sends logged-in users to their dashboard and everyone else to login
// "/" shows the landing page to visitors and sends logged-in users to their dashboard
const Home = () => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner fullScreen />
  return user ? <Navigate to={getDashboardPath(user.role)} replace /> : <Landing />
}

const App = () => {
  return (
    // Suspense shows the spinner while a lazy page is being downloaded
    <Suspense fallback={<Spinner fullScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Only for users who are NOT logged in */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Student pages */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/jobs" element={<Jobs />} />
            <Route path="/student/jobs/:id" element={<JobDetails />} />
            <Route path="/student/applications" element={<MyApplications />} />
            <Route path="/student/drives" element={<Drives />} />
            <Route path="/student/mock-tests" element={<MockTests />} />
            <Route path="/student/mock-tests/:id/take" element={<TakeTest />} />
            <Route path="/student/mock-tests/attempts/:attemptId" element={<TestResult />} />
            <Route path="/student/interviews" element={<MockInterviews />} />
            <Route path="/student/interviews/:id" element={<InterviewSession />} />
            <Route path="/student/assistant" element={<AiAssistant />} />
            <Route path="/student/interview-prep" element={<InterviewPrep />} />
          </Route>
        </Route>

        {/* Recruiter pages */}
        <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/jobs" element={<MyJobs />} />
            <Route path="/recruiter/jobs/new" element={<JobEditor />} />
            <Route path="/recruiter/jobs/:id/edit" element={<JobEditor />} />
            <Route path="/recruiter/jobs/:id/applicants" element={<Applicants />} />
          </Route>
        </Route>

        {/* Admin pages */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/recruiters" element={<ManageRecruiters />} />
            <Route path="/admin/jobs" element={<ManageJobs />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/students/:id" element={<StudentDetail />} />
            <Route path="/admin/drives" element={<ManageDrives />} />
            <Route path="/admin/announcements" element={<ManageAnnouncements />} />
            <Route path="/admin/mock-tests" element={<ManageMockTests />} />
            <Route path="/admin/mock-tests/new" element={<MockTestEditor />} />
            <Route path="/admin/mock-tests/:id/edit" element={<MockTestEditor />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
