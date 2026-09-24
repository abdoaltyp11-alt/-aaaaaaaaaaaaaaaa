import { Link, useParams } from 'react-router-dom';
import { getAppointmentById } from '@/services/bookingData';

export default function BookingSuccessPage() {
  const { appointmentId } = useParams();
  const appointment = appointmentId ? getAppointmentById(appointmentId) : undefined;

  if (!appointment) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-12">
        <div className="card p-8 text-center text-slate-600">لا توجد تفاصيل للحجز الحالي.</div>
      </div>
    );
  }

  return (
    <div className="app-shell px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">✅</div>
          <h1 className="text-3xl font-black text-slate-900">تم إنشاء طلب الحجز</h1>
          <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">الحجز بانتظار إتمام الدفع، ولن يتم تأكيد الموعد قبل نجاح العملية.</p>
          <p className="mt-3 text-slate-600">رقم الحجز: {appointment.id}</p>

          <div className="mt-6 grid gap-4 text-right md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">الطبيب</div>
              <div className="mt-1 font-bold text-slate-900">{appointment.doctorName}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">الخدمة</div>
              <div className="mt-1 font-bold text-slate-900">{appointment.serviceName}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">التاريخ</div>
              <div className="mt-1 font-bold text-slate-900">{appointment.date}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">الوقت</div>
              <div className="mt-1 font-bold text-slate-900">{appointment.time}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">المبلغ</div>
              <div className="mt-1 font-bold text-slate-900">{appointment.price} جنيه مصري</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/booking/appointments" className="btn-primary">
              حجوزاتي
            </Link>
            <Link to="/patient" className="btn-secondary">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
