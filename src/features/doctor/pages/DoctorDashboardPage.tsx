import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';
import { Appointment, createPrescription, getAppointmentsByDoctor, subscribeToDoctorAppointments, updateAppointmentStatus } from '@/services/bookingData';

export default function DoctorDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const doctorId = user?.id ?? 'doc-sarah';
  const [appointments, setAppointments] = useState<Appointment[]>(() => getAppointmentsByDoctor(doctorId));
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState('');

  useEffect(() => subscribeToDoctorAppointments(doctorId, setAppointments), [doctorId]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  const handlePrescription = (event: FormEvent, appointmentId: string, patientId: string) => {
    event.preventDefault();
    if (!diagnosis.trim() || !medications.trim()) return;

    createPrescription({ appointmentId, patientId, doctorId, doctorName: user?.fullName ?? 'الطبيب', diagnosis: diagnosis.trim(), medications: medications.trim() });
    setDiagnosis('');
    setMedications('');
    setSelectedAppointment(null);
  };

  const confirmedAppointments = appointments.filter((appointment) => appointment.status === 'confirmed').length;
  const revenue = appointments.filter((appointment) => appointment.paymentStatus === 'paid').reduce((total, appointment) => total + appointment.price, 0);

  return (
    <div className="app-shell px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="card mb-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-700">مساحة الطبيب</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">أهلاً {user?.fullName ?? 'د. سارة علي'}</h1>
              <p className="mt-1 text-sm text-slate-500">تابع حجوزات مرضاك واكتب الروشتات من نفس الشاشة.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/patient" className="btn-secondary">الواجهة الرئيسية</Link>
              <button type="button" className="btn-primary" onClick={handleLogout}>تسجيل الخروج</button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card p-5"><h2 className="text-sm text-slate-500">إجمالي الحجوزات</h2><p className="mt-2 text-3xl font-black text-slate-900">{appointments.length}</p></div>
          <div className="card p-5"><h2 className="text-sm text-slate-500">المواعيد المؤكدة</h2><p className="mt-2 text-3xl font-black text-slate-900">{confirmedAppointments}</p></div>
          <div className="card p-5"><h2 className="text-sm text-slate-500">الإيرادات المدفوعة</h2><p className="mt-2 text-3xl font-black text-slate-900">{revenue} جنيه</p></div>
          <div className="card p-5"><h2 className="text-sm text-slate-500">الحالة</h2><p className="mt-2 text-3xl font-black text-brand-700">مفعّل</p></div>
        </div>

        <section className="card mt-6 p-5">
          <h2 className="text-2xl font-black text-slate-900">حجوزات المرضى</h2>
          <p className="mt-1 text-sm text-slate-500">كل حجز هنا مرتبط بالمريض الذي أنشأه من شاشة الحجز.</p>
          {appointments.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600">لا توجد حجوزات لهذا الطبيب حتى الآن.</div>
          ) : (
            <div className="mt-5 space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{appointment.patientName}</h3>
                      <p className="text-sm text-slate-500">{appointment.serviceName} • {appointment.date} • {appointment.time}</p>
                      <p className="mt-1 text-sm font-bold text-brand-700">{appointment.price} جنيه مصري • {appointment.paymentStatus === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {appointment.status === 'pending_payment' && <button type="button" className="btn-primary" onClick={() => { updateAppointmentStatus(appointment.id, 'confirmed'); }}>تأكيد الموعد</button>}
                      <button type="button" className="btn-secondary" onClick={() => setSelectedAppointment(selectedAppointment === appointment.id ? null : appointment.id)}>كتابة روشتة</button>
                    </div>
                  </div>
                  {selectedAppointment === appointment.id && (
                    <form onSubmit={(event) => handlePrescription(event, appointment.id, appointment.patientId)} className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
                      <input className="input" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="التشخيص" required />
                      <textarea className="input min-h-[100px]" value={medications} onChange={(event) => setMedications(event.target.value)} placeholder="الأدوية والتعليمات" required />
                      <button type="submit" className="btn-primary justify-self-start">حفظ الروشتة للمريض</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
