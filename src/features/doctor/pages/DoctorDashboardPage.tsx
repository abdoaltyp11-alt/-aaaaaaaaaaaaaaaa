import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState, DashboardError, DashboardLayout, DashboardSection, DashboardStat, appointmentStatusLabels, formatDashboardDate, todayDateKey } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/AuthProvider';
import { Appointment, createPrescription, getAppointmentsByDoctor, subscribeToDoctorAppointments, updateAppointmentStatus } from '@/services/bookingData';

type AppointmentFilter = 'today' | 'upcoming' | 'completed' | 'cancelled';

const filters: { id: AppointmentFilter; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: 'upcoming', label: 'القادم' },
  { id: 'completed', label: 'مكتمل' },
  { id: 'cancelled', label: 'ملغي' },
];

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const doctorId = user?.id ?? '';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState('');
  const [filter, setFilter] = useState<AppointmentFilter>('today');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!doctorId) return undefined;
    setAppointments(getAppointmentsByDoctor(doctorId));
    return subscribeToDoctorAppointments(
      doctorId,
      (items) => {
        setAppointments(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setDataError(true);
      },
    );
  }, [doctorId]);

  const todaysAppointments = appointments.filter((appointment) => appointment.date === todayDateKey() && appointment.status !== 'cancelled');
  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending_payment');
  const completedAppointments = appointments.filter((appointment) => appointment.status === 'completed');
  const patientCount = new Set(appointments.map((appointment) => appointment.patientId)).size;

  const visibleAppointments = useMemo(() => appointments
    .filter((appointment) => {
      if (filter === 'today') return appointment.date === todayDateKey() && appointment.status !== 'cancelled';
      if (filter === 'upcoming') return appointment.date > todayDateKey() && !['cancelled', 'completed', 'no_show'].includes(appointment.status);
      if (filter === 'completed') return appointment.status === 'completed';
      return appointment.status === 'cancelled';
    })
    .filter((appointment) => `${appointment.patientName} ${appointment.serviceName} ${appointment.date}`.toLocaleLowerCase('ar').includes(search.trim().toLocaleLowerCase('ar')))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [appointments, filter, search]);

  const handlePrescription = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedAppointment || !diagnosis.trim() || !medications.trim()) return;
    setFormError('');

    try {
      createPrescription({
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        doctorId,
        doctorName: user?.fullName ?? 'الطبيب',
        diagnosis: diagnosis.trim(),
        medications: medications.trim(),
      });
      setDiagnosis('');
      setMedications('');
      setSelectedAppointment(null);
    } catch {
      setFormError('تعذر حفظ الوصفة. تحقق من الاتصال وحاول مرة أخرى.');
    }
  };

  const openPrescription = (appointment: Appointment) => {
    setFormError('');
    setSelectedAppointment(appointment);
  };

  return (
    <DashboardLayout role="DOCTOR" eyebrow="الرعاية الطبية" title={`مرحباً، ${user?.fullName || 'دكتور'}`}>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-teal-700">مساحة العمل الطبية</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">إدارة مواعيد مرضاك من مكان واحد</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">تابع المواعيد المسندة إلى حسابك، أكّد الحجز، وأضف الوصفات إلى سجل المريض.</p>
          </div>
          <button type="button" onClick={() => document.getElementById('appointments')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-5 font-bold text-white transition hover:bg-teal-800">
            عرض جدول المواعيد
          </button>
        </section>

        {dataError && <DashboardError message="تعذر تحميل المواعيد الطبية المصرح بها لهذا الحساب. تحقق من اتصال Firebase وصلاحيات قاعدة البيانات." />}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat label="المرضى المرتبطون" value={dataError ? '—' : patientCount} detail="مرضى لديهم موعد مسجل معك." isLoading={loading} />
          <DashboardStat label="مواعيد اليوم" value={dataError ? '—' : todaysAppointments.length} detail="المواعيد المسجلة بتاريخ اليوم." isLoading={loading} />
          <DashboardStat label="تحتاج تأكيداً" value={dataError ? '—' : pendingAppointments.length} detail="حجوزات بانتظار استكمال الدفع أو التأكيد." isLoading={loading} />
          <DashboardStat label="مواعيد مكتملة" value={dataError ? '—' : completedAppointments.length} detail="المواعيد التي سجلت كمكتملة." isLoading={loading} />
        </div>

        <DashboardSection
          title="جدول المواعيد"
          detail="تظهر هنا فقط المواعيد المرتبطة بمعرّف حسابك."
        >
          <div id="appointments" className="scroll-mt-28">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div role="tablist" aria-label="تصفية المواعيد" className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${filter === item.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="relative block w-full lg:max-w-sm">
                <span className="sr-only">البحث في المواعيد</span>
                <input className="input min-h-11 rounded-xl pr-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المريض أو الخدمة" />
                <span aria-hidden="true" className="absolute right-3 top-3 text-slate-400">⌕</span>
              </label>
            </div>

            {loading ? (
              <div role="status" aria-label="جار تحميل المواعيد" className="space-y-3">
                {[1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : dataError ? (
              <DashboardEmptyState title="تعذر تحميل المواعيد" detail="لا يمكن عرض قائمة فارغة على أنها نتيجة مؤكدة. تحقق من اتصال Firebase وصلاحيات قراءة مواعيد الطبيب." />
            ) : visibleAppointments.length ? (
              <div className="space-y-3">
                {visibleAppointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-200 sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-lg text-teal-800">م</span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">{appointment.patientName}</h3>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{appointmentStatusLabels[appointment.status] ?? appointment.status}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{appointment.serviceName} · {appointment.appointmentType === 'online' ? 'عن بُعد' : 'في العيادة'}</p>
                          <p className="mt-2 text-sm text-slate-500">{formatDashboardDate(appointment.date)} · {appointment.time} · {appointment.price} ج.م</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {appointment.status === 'pending_payment' && (
                          <button type="button" className="btn-primary min-h-10 px-4 py-2 text-sm" onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}>
                            تأكيد الموعد
                          </button>
                        )}
                        <button type="button" className="btn-secondary min-h-10 px-4 py-2 text-sm" onClick={() => openPrescription(appointment)}>
                          إضافة وصفة
                        </button>
                      </div>
                    </div>
                    {appointment.notes && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">ملاحظات المريض: {appointment.notes}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title={search ? 'لا توجد نتائج مطابقة' : 'لا توجد مواعيد في هذا القسم'}
                detail={search ? 'جرّب البحث باسم مختلف أو أزل كلمات البحث.' : 'ستظهر هنا المواعيد المرتبطة بحساب الطبيب عند تسجيلها.'}
                action={search ? <button type="button" className="btn-secondary" onClick={() => setSearch('')}>مسح البحث</button> : undefined}
              />
            )}
          </div>
        </DashboardSection>

        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAppointment(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="prescription-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-700">وصفة مرتبطة بموعد</p>
                  <h2 id="prescription-title" className="mt-1 text-xl font-black text-slate-900">إضافة وصفة طبية</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedAppointment.patientName} · {formatDashboardDate(selectedAppointment.date)}</p>
                </div>
                <button type="button" aria-label="إغلاق نافذة الوصفة" className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-500 hover:bg-slate-100" onClick={() => setSelectedAppointment(null)}>×</button>
              </div>
              <form onSubmit={handlePrescription} className="mt-6 space-y-4">
                {formError && <DashboardError message={formError} />}
                <div>
                  <label htmlFor="prescription-diagnosis" className="label">التشخيص</label>
                  <input id="prescription-diagnosis" className="input" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} required />
                </div>
                <div>
                  <label htmlFor="prescription-medications" className="label">الأدوية والتعليمات</label>
                  <textarea id="prescription-medications" className="input min-h-32" value={medications} onChange={(event) => setMedications(event.target.value)} required />
                </div>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button type="button" className="btn-secondary" onClick={() => setSelectedAppointment(null)}>إلغاء</button>
                  <button type="submit" className="btn-primary">حفظ الوصفة</button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
