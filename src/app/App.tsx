import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '@/features/auth/pages/LandingPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import OtpPage from '@/features/auth/pages/OtpPage';
import { AuthProvider, useAuth } from '@/app/AuthProvider';
import { BASE_PATHS } from '@/lib/constants';

const PatientDashboardPage = lazy(() => import('@/features/patient/pages/PatientDashboardPage'));
const DoctorDashboardPage = lazy(() => import('@/features/doctor/pages/DoctorDashboardPage'));
const ConsultantDashboardPage = lazy(() => import('@/features/consultant/pages/ConsultantDashboardPage'));
const NurseDashboardPage = lazy(() => import('@/features/nurse/pages/NurseDashboardPage'));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const BookingSearchPage = lazy(() => import('@/features/booking/pages/BookingSearchPage'));
const DoctorProfilePage = lazy(() => import('@/features/booking/pages/DoctorProfilePage'));
const BookingFlowPage = lazy(() => import('@/features/booking/pages/BookingFlowPage'));
const BookingSuccessPage = lazy(() => import('@/features/booking/pages/BookingSuccessPage'));
const AppointmentsPage = lazy(() => import('@/features/booking/pages/AppointmentsPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const CallPage = lazy(() => import('@/features/video-call/pages/CallPage'));

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4" role="status" aria-live="polite">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
        جار تحميل الصفحة…
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4" role="status" aria-live="polite">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
          جار التحقق من جلسة الدخول…
        </div>
      </div>
    );
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

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to={BASE_PATHS[user.role] ?? '/'} replace />;
  }

  return <>{children}</>;
}

function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? BASE_PATHS[user.role] ?? '/' : '/'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoading />}>
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

        <Route path="*" element={<RoleHomeRedirect />} />
       </Routes>
      </Suspense>
    </AuthProvider>
  );
}
