import { Link, useNavigate, useParams } from 'react-router-dom';
import { getDoctorById, getDoctorServices } from '@/services/bookingData';

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const doctor = doctorId ? getDoctorById(doctorId) : undefined;
  const services = doctorId ? getDoctorServices(doctorId) : [];

  if (!doctor) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-12">
        <div className="card max-w-lg p-8 text-center text-slate-600">
          الطبيب المطلوب غير موجود حالياً.
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="card overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
            <img src={doctor.photo} alt={doctor.fullName} className="h-56 w-full rounded-[24px] object-cover md:h-full" />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-slate-900">{doctor.fullName}</h1>
                {doctor.verified && (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">موثق</span>
                )}
              </div>

              <p className="mt-2 text-lg text-brand-700">{doctor.title}</p>
              <p className="mt-4 text-slate-600">{doctor.bio}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">التقييم</div>
                  <div className="mt-1 font-bold text-slate-900">⭐ {doctor.rating}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">التجربة</div>
                  <div className="mt-1 font-bold text-slate-900">{doctor.experience} سنوات</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">سعر الكشف</div>
                  <div className="mt-1 font-bold text-slate-900">{doctor.consultationPrice} جنيه مصري</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/booking/checkout/${doctor.id}`} className="btn-primary">
                  احجز موعد
                </Link>
                <Link to="/booking" className="btn-secondary">
                  العودة للبحث
                </Link>
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                  رجوع
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-slate-900">الخدمات المتاحة</h2>
            <div className="mt-4 space-y-3">
              {services.map((service) => (
                <div key={service.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{service.name}</div>
                      <div className="text-sm text-slate-500">{service.duration} دقيقة • {service.type === 'online' ? 'أونلاين' : 'في العيادة'}</div>
                    </div>
                    <div className="font-bold text-brand-700">{service.price} جنيه مصري</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-bold text-slate-900">مواعيد المتاحة</h2>
            <div className="mt-4 space-y-2">
              {doctor.availableDates.map((date) => (
                <div key={date} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                  {date} • {doctor.timeSlots.slice(0, 3).join(' / ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
