import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';
import { Appointment, getAppointmentsByUser, getPrescriptionsByPatient, getSpecialties, Prescription, subscribeToPatientPrescriptions, subscribeToSpecialties, subscribeToUserAppointments } from '@/services/bookingData';

export default function PatientDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [specialties, setSpecialties] = useState(() => getSpecialties());

  useEffect(() => {
    if (!user) return undefined;
    setAppointments(getAppointmentsByUser(user.id));
    setPrescriptions(getPrescriptionsByPatient(user.id));
    const unsubscribeAppointments = subscribeToUserAppointments(user.id, setAppointments);
    const unsubscribePrescriptions = subscribeToPatientPrescriptions(user.id, setPrescriptions);
    const unsubscribeSpecialties = subscribeToSpecialties(setSpecialties);
    return () => {
      unsubscribeAppointments();
      unsubscribePrescriptions();
      unsubscribeSpecialties();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="app-shell px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="card mb-6 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {user?.fullName?.charAt(0) ?? 'م'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{user?.fullName ?? 'مستخدم'}</h1>
                <p className="text-sm text-slate-500">لوحة المريض</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-secondary">الإشعارات</button>
              <Link to="/profile" className="btn-secondary">الملف الشخصي</Link>
              <button type="button" className="btn-primary" onClick={handleLogout}>تسجيل الخروج</button>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">احجز موعدك</h2>
            <Link to="/booking" className="btn-primary">ابدأ الحجز</Link>
          </div>

          <div className="card p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {specialties.map((specialty) => (
                <Link
                  key={specialty.id}
                  to={`/booking?specialty=${encodeURIComponent(specialty.id)}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-brand-200 hover:bg-brand-50"
                >
                  <div className="text-lg font-medium text-slate-700">{specialty.icon} {specialty.arabicName}</div>
                </Link>
              ))}
            </div>
            {specialties.length === 0 && <p className="p-6 text-center text-sm text-slate-500">لا توجد تخصصات متاحة حاليًا.</p>}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link to="/booking/appointments" className="card p-5 transition hover:-translate-y-0.5 hover:border-brand-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">حجوزاتي</h3>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">{appointments.length}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">تابع مواعيدك وحالة الدفع في مكان واحد.</p>
          </Link>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">روشتاتي</h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{prescriptions.length}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{prescriptions.length ? 'آخر روشتة متاحة من طبيبك.' : 'لا توجد روشتات مسجلة حتى الآن.'}</p>
          </div>
          <div className="card p-5">
            <h3 className="text-lg font-bold text-slate-900">ملفي الصحي</h3>
            <p className="mt-3 text-sm text-slate-600">بياناتك الطبية ومتابعة العلاج في شاشة واحدة.</p>
          </div>
        </section>

        {prescriptions.length > 0 && (
          <section className="card mt-6 p-5">
            <h2 className="text-xl font-bold text-slate-900">آخر الروشتات</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {prescriptions.slice(0, 4).map((prescription) => (
                <div key={prescription.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-bold text-slate-900">{prescription.doctorName}</div>
                  <div className="mt-2 text-sm text-slate-600">التشخيص: {prescription.diagnosis}</div>
                  <div className="mt-1 text-sm text-slate-600">الأدوية: {prescription.medications}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
