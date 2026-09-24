import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';
import { INSTAPAY_NUMBER } from '@/lib/constants';
import { createAppointment, getAvailableDaysForDoctor, getAvailableSlotsForDoctor, getDoctorById, getDoctorServices, PaymentMethod } from '@/services/bookingData';

export default function BookingFlowPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const doctor = doctorId ? getDoctorById(doctorId) : undefined;
  const services = doctorId ? getDoctorServices(doctorId) : [];
  const dates = doctorId ? getAvailableDaysForDoctor(doctorId) : [];

  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [date, setDate] = useState(dates[0] ?? '');
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? services[0],
    [serviceId, services],
  );

  const availableSlots = useMemo(() => {
    if (!doctor || !date) return [];
    return getAvailableSlotsForDoctor(doctor.id, date);
  }, [date, doctor]);

  const total = selectedService ? selectedService.price : doctor?.consultationPrice ?? 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!doctor || !selectedService || !user || !date || !slot) {
      return;
    }

    setLoading(true);

    try {
      const appointment = createAppointment({
        patientId: user.id,
        patientName: user.fullName,
        doctorId: doctor.id,
        serviceId: selectedService.id,
        appointmentType: selectedService.type,
        date,
        time: slot,
        duration: selectedService.duration,
        price: total,
        paymentMethod,
        notes,
      });

      navigate(`/booking/success/${appointment.id}`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-12">
        <div className="card p-8 text-center text-slate-600">الطبيب غير موجود.</div>
      </div>
    );
  }

  return (
    <div className="app-shell px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-700">خطوات الحجز</p>
              <h1 className="text-3xl font-black text-slate-900">حجز موعد مع {doctor.fullName}</h1>
            </div>
            <div className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              {doctor.consultationPrice} جنيه مصري
            </div>
          </div>

          <div className="mb-8 grid gap-2 md:grid-cols-5">
            {['الخدمة', 'التاريخ', 'الموعد', 'المراجعة', 'الدفع'].map((item, index) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-sm font-medium text-slate-600">
                <div className="text-xs text-slate-500">0{index + 1}</div>
                {item}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">اختر الخدمة</label>
              <div className="grid gap-3 md:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setServiceId(service.id)}
                    className={`rounded-2xl border p-4 text-right transition ${
                      serviceId === service.id
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-900">{service.name}</span>
                      <span className="text-sm font-bold text-brand-700">{service.price} جنيه مصري</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {service.duration} دقيقة • {service.type === 'online' ? 'أونلاين' : 'في العيادة'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">اختر التاريخ</label>
              <div className="grid gap-3 md:grid-cols-3">
                {dates.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setDate(day)}
                    className={`rounded-2xl border p-3 text-sm font-medium ${
                      date === day ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">اختر الوقت</label>
              <div className="grid gap-3 md:grid-cols-4">
                {availableSlots.length > 0 ? (
                  availableSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSlot(time)}
                      className={`rounded-2xl border p-3 text-sm font-medium ${
                        slot === time ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-500 md:col-span-4">
                    لا توجد مواعيد متاحة في هذا اليوم.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">ملاحظات</label>
              <textarea
                className="input min-h-[120px]"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="أضف ملاحظاتك أو وصف المشكلة"
              />
            </div>

            <div>
              <label className="label">طريقة الدفع</label>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['card', 'بطاقة بنكية'],
                  ['fawry', 'فوري'],
                  ['instapay', 'إنستا باي'],
                ].map(([value, label]) => (
                  <label key={value} className={`cursor-pointer rounded-2xl border p-4 transition ${paymentMethod === value ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={value}
                      checked={paymentMethod === value}
                      onChange={() => setPaymentMethod(value as PaymentMethod)}
                      className="ml-2"
                    />
                    <span className="font-medium text-slate-800">{label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">سيتم فتح بوابة الدفع الآمنة بعد ربط خادم الدفع الخاص بالمشروع.</p>
              {paymentMethod === 'instapay' && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <div>
                    <div className="text-sm font-bold text-sky-900">حوّل قيمة الحجز على إنستا باي</div>
                    <div className="mt-1 text-lg font-black tracking-wider text-sky-800">{INSTAPAY_NUMBER}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      await navigator.clipboard?.writeText(INSTAPAY_NUMBER);
                      setCopied(true);
                    }}
                  >
                    {copied ? 'تم نسخ الرقم' : 'نسخ الرقم'}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">الإجمالي</span>
                <span className="text-2xl font-black text-slate-900">{total} جنيه مصري</span>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                رجوع
              </button>
              <button type="submit" className="btn-primary" disabled={loading || !date || !slot}>
                {loading ? 'جاري تجهيز الدفع...' : 'تأكيد ومتابعة الدفع'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
