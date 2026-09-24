import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';
import { getAppointmentsByUser, subscribeToUserAppointments, Appointment } from '@/services/bookingData';
import { canJoinAppointment } from '@/features/video-call/hooks/useWebRTC';

export default function AppointmentsPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const [appointments, setAppointments] = useState<Appointment[]>(() => getAppointmentsByUser(user.id));

  useEffect(() => subscribeToUserAppointments(user.id, setAppointments), [user.id]);

  return (
    <div className="app-shell px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">حجوزاتي</p>
            <h1 className="text-3xl font-black text-slate-900">سجل الحجوزات</h1>
          </div>
          <Link to="/booking" className="btn-primary">
            حجز موعد جديد
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="card p-10 text-center text-slate-600">
            لا توجد حجوزات حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="card p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-xl text-brand-700">
                      🩺
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{appointment.doctorName}</h2>
                      <p className="text-sm text-slate-500">{appointment.serviceName}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{appointment.date}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{appointment.time}</span>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">{appointment.price} جنيه مصري • {appointment.paymentStatus === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}</span>
                    {appointment.appointmentType === 'online' && (
                      <Link to={`/calls/${appointment.id}`} className="btn-primary px-3 py-1.5 text-sm">
                        {canJoinAppointment(appointment) ? 'دخول المكالمة' : 'غرفة الانتظار'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
