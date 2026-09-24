import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '@/features/auth/pages/LandingPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import OtpPage from '@/features/auth/pages/OtpPage';
import { AuthProvider, useAuth } from '@/app/AuthProvider';
import PatientDashboardPage from '@/features/patient/pages/PatientDashboardPage';
import DoctorDashboardPage from '@/features/doctor/pages/DoctorDashboardPage';
import ConsultantDashboardPage from '@/features/consultant/pages/ConsultantDashboardPage';
import NurseDashboardPage from '@/features/nurse/pages/NurseDashboardPage';
import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import BookingSearchPage from '@/features/booking/pages/BookingSearchPage';
import DoctorProfilePage from '@/features/booking/pages/DoctorProfilePage';
import BookingFlowPage from '@/features/booking/pages/BookingFlowPage';
import BookingSuccessPage from '@/features/booking/pages/BookingSuccessPage';
import AppointmentsPage from '@/features/booking/pages/AppointmentsPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import CallPage from '@/features/video-call/pages/CallPage';
import { BASE_PATHS } from '@/lib/constants';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();

  if (!authReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({
  allowed,
  children,
}: {
  allowed: Array<'PATIENT' | 'DOCTOR' | 'CONSULTANT' | 'NURSE' | 'ADMIN'>;
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={BASE_PATHS.PATIENT} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/otp" element={<OtpPage />} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={['PATIENT']}>
                <PatientDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="/booking" element={<ProtectedRoute><RoleRoute allowed={['PATIENT']}><BookingSearchPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/booking/doctor/:doctorId" element={<ProtectedRoute><RoleRoute allowed={['PATIENT']}><DoctorProfilePage /></RoleRoute></ProtectedRoute>} />
        <Route path="/booking/checkout/:doctorId" element={<ProtectedRoute><RoleRoute allowed={['PATIENT']}><BookingFlowPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/booking/success/:appointmentId" element={<ProtectedRoute><RoleRoute allowed={['PATIENT']}><BookingSuccessPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/booking/appointments" element={<ProtectedRoute><RoleRoute allowed={['PATIENT']}><AppointmentsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/calls/:appointmentId" element={<ProtectedRoute><RoleRoute allowed={['PATIENT', 'DOCTOR']}><CallPage /></RoleRoute></ProtectedRoute>} />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={['DOCTOR']}>
                <DoctorDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultant"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={['CONSULTANT']}>
                <ConsultantDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nurse"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={['NURSE']}>
                <NurseDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={['ADMIN']}>
                <AdminDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
