import { useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState, DashboardError, DashboardLayout, DashboardSection, DashboardStat, appointmentStatusLabels, formatDashboardDate, todayDateKey } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/AuthProvider';
import { Appointment, getAppointmentsByNurse, subscribeToNurseAppointments } from '@/services/bookingData';

type NurseFilter = 'today' | 'upcoming' | 'completed' | 'cancelled';

const nurseFilters: { id: NurseFilter; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: 'upcoming', label: 'القادم' },
  { id: 'completed', label: 'مكتمل' },
  { id: 'cancelled', label: 'ملغي' },
];

export default function NurseDashboardPage() {
  const { user } = useAuth();
  const nurseId = user?.id ?? '';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<NurseFilter>('today');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    if (!nurseId) return undefined;
    setAppointments(getAppointmentsByNurse(nurseId));
    return subscribeToNurseAppointments(
      nurseId,
      (items) => {
        setAppointments(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setDataError(true);
      },
    );
  }, [nurseId]);

  const visibleAppointments = useMemo(() => appointments
    .filter((appointment) => {
      if (filter === 'today') return appointment.date === todayDateKey() && appointment.status !== 'cancelled';
      if (filter === 'upcoming') return appointment.date > todayDateKey() && !['cancelled', 'completed', 'no_show'].includes(appointment.status);
      if (filter === 'completed') return appointment.status === 'completed';
      return appointment.status === 'cancelled';
    })
    .filter((appointment) => `${appointment.patientName} ${appointment.serviceName} ${appointment.date}`.toLocaleLowerCase('ar').includes(search.trim().toLocaleLowerCase('ar')))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [appointments, filter, search]);

  const todayCount = appointments.filter((appointment) => appointment.date === todayDateKey() && appointment.status !== 'cancelled').length;
  const upcomingCount = appointments.filter((appointment) => appointment.date > todayDateKey() && !['cancelled', 'completed', 'no_show'].includes(appointment.status)).length;
  const uniquePatients = new Set(appointments.map((appointment) => appointment.patientId)).size;

  return (
    <DashboardLayout role="NURSE" eyebrow="الرعاية التمريضية" title={`مرحباً، ${user?.fullName || 'بك'}`}>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-teal-900 p-6 text-white shadow-lg sm:p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-teal-200">مساحة الفريق التمريضي</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">تنظيم واضح للمتابعات المسندة إليك</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">يعرض الجدول المواعيد التي تتضمن معرّف حسابك كممرض، وفق صلاحيات قاعدة البيانات.</p>
          </div>
          <button type="button" onClick={() => document.getElementById('nurse-schedule')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 font-bold text-slate-900 transition hover:bg-teal-50">
            الانتقال إلى الجدول
          </button>
        </section>

        {dataError && <DashboardError message="تعذر تحميل المواعيد المسندة لهذا الحساب. تحقق من اتصال Firebase وصلاحيات قاعدة البيانات." />}

        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardStat label="مواعيد اليوم" value={dataError ? '—' : todayCount} detail="المواعيد المسندة لهذا الحساب بتاريخ اليوم." isLoading={loading} />
          <DashboardStat label="المتابعات القادمة" value={dataError ? '—' : upcomingCount} detail="مواعيد مستقبلية لم تسجل كمكتملة أو ملغاة." isLoading={loading} />
          <DashboardStat label="المرضى المرتبطون" value={dataError ? '—' : uniquePatients} detail="مرضى لديهم موعد مسند إلى حسابك." isLoading={loading} />
        </div>

        <DashboardSection title="جدول المتابعة" detail="ابحث بالاسم أو الخدمة، أو اعرض المواعيد حسب حالتها.">
          <div id="nurse-schedule" className="scroll-mt-28">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div role="tablist" aria-label="تصفية المواعيد" className="flex flex-wrap gap-2">
                {nurseFilters.map((item) => (
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
                {[1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : dataError ? (
              <DashboardEmptyState title="تعذر تحميل المواعيد" detail="لا يمكن اعتبار عدم تحميل البيانات نتيجة خالية من المواعيد. تحقق من اتصال Firebase وصلاحيات الحساب." />
            ) : visibleAppointments.length ? (
              <div className="space-y-3">
                {visibleAppointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{appointment.patientName}</h3>
                        <p className="mt-1 text-sm text-slate-600">{appointment.serviceName}</p>
                      </div>
                      <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{appointmentStatusLabels[appointment.status] ?? appointment.status}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                      <span>{formatDashboardDate(appointment.date)}</span>
                      <span>{appointment.time}</span>
                      <span>{appointment.appointmentType === 'online' ? 'عن بُعد' : 'في العيادة'}</span>
                    </div>
                    {appointment.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">ملاحظات الموعد: {appointment.notes}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title={search ? 'لا توجد نتائج مطابقة' : 'لا توجد مواعيد في هذا القسم'}
                detail={search ? 'جرّب البحث باسم مختلف أو أزل كلمات البحث.' : 'ستظهر المتابعات هنا عند إسناد موعد إلى حسابك في قاعدة البيانات.'}
                action={search ? <button type="button" className="btn-secondary" onClick={() => setSearch('')}>مسح البحث</button> : undefined}
              />
            )}
          </div>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
