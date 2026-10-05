import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardEmptyState, DashboardError, DashboardLayout, DashboardSection, DashboardStat, appointmentStatusLabels, formatDashboardDate, todayDateKey } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/AuthProvider';
import { Appointment, getAppointmentsByUser, getPrescriptionsByPatient, getSpecialties, Prescription, Specialty, subscribeToPatientPrescriptions, subscribeToSpecialties, subscribeToUserAppointments } from '@/services/bookingData';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>(() => getSpecialties());
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    setAppointments(getAppointmentsByUser(user.id));
    setPrescriptions(getPrescriptionsByPatient(user.id));
    const handleError = () => {
      setLoading(false);
      setDataError(true);
    };
    const unsubscribeAppointments = subscribeToUserAppointments(user.id, (items) => {
      setAppointments(items);
      setLoading(false);
    }, handleError);
    const unsubscribePrescriptions = subscribeToPatientPrescriptions(user.id, setPrescriptions, handleError);
    const unsubscribeSpecialties = subscribeToSpecialties(setSpecialties, handleError);
    return () => {
      unsubscribeAppointments();
      unsubscribePrescriptions();
      unsubscribeSpecialties();
    };
  }, [user]);

  const { nextAppointments, history } = useMemo(() => {
    const future = appointments
      .filter((appointment) => appointment.date >= todayDateKey() && !['cancelled', 'completed', 'no_show'].includes(appointment.status))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    const past = [...appointments]
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    return { nextAppointments: future, history: past };
  }, [appointments]);

  const nextAppointment = nextAppointments[0];
  const latestPrescription = [...prescriptions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <DashboardLayout role="PATIENT" eyebrow="مساحتك الصحية" title={`أهلاً، ${user?.fullName || 'بك'}`}>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-teal-800 via-teal-700 to-cyan-700 p-6 text-white shadow-lg shadow-teal-900/10 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-teal-100">رعايتك الصحية في مكان واحد</p>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">تابع مواعيدك وخطتك العلاجية بسهولة</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-teal-50/90">ستجد هنا المواعيد والوصفات المرتبطة بحسابك فقط، كما تظهر في سجلك الصحي.</p>
            </div>
            <Link to="/booking" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 font-bold text-teal-800 transition hover:bg-teal-50">
              ابحث عن طبيب واحجز
            </Link>
          </div>
        </section>

        {dataError && <DashboardError message="تعذر تحميل بعض بياناتك الصحية. تحقق من اتصالك، ثم أعد تحميل الصفحة." />}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardStat label="المواعيد القادمة" value={dataError ? '—' : nextAppointments.length} detail="مواعيدك غير المكتملة والمسجلة في النظام." isLoading={loading} />
          <DashboardStat label="الوصفات الطبية" value={dataError ? '—' : prescriptions.length} detail="الوصفات المرتبطة بملفك الصحي." isLoading={loading} />
          <DashboardStat label="التخصصات المتاحة" value={dataError ? '—' : specialties.length} detail="التخصصات المنشورة فعلياً في كتالوج الحجز." isLoading={loading} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <DashboardSection
            title="موعدك القادم"
            detail="أقرب موعد غير ملغي في سجل حسابك."
            action={<Link to="/booking/appointments" className="text-sm font-bold text-teal-700 hover:text-teal-900">كل المواعيد</Link>}
          >
            {loading ? (
              <div role="status" aria-label="جار تحميل المواعيد" className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ) : dataError ? (
              <DashboardEmptyState title="تعذر تحميل المواعيد" detail="لا يمكن تأكيد عدم وجود مواعيد حتى تكتمل قراءة بيانات Firebase." />
            ) : nextAppointment ? (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-800">{appointmentStatusLabels[nextAppointment.status] ?? nextAppointment.status}</span>
                    <h3 className="mt-3 text-xl font-black text-slate-900">{nextAppointment.doctorName}</h3>
                    <p className="mt-1 text-sm text-slate-600">{nextAppointment.serviceName}</p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 text-left">
                    <div className="font-bold text-slate-900">{formatDashboardDate(nextAppointment.date)}</div>
                    <div className="mt-1 text-sm text-slate-500">{nextAppointment.time}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-teal-100 pt-4 text-sm">
                  <span className="text-slate-600">{nextAppointment.appointmentType === 'online' ? 'استشارة عن بُعد' : 'زيارة في العيادة'}</span>
                  <Link to="/booking/appointments" className="font-bold text-teal-800 hover:underline">تفاصيل الحجوزات</Link>
                </div>
              </div>
            ) : (
              <DashboardEmptyState
                title="لا توجد مواعيد قادمة"
                detail="ستظهر مواعيدك هنا بمجرد حجزها وتسجيلها في حسابك."
                action={<Link to="/booking" className="btn-primary">احجز موعداً</Link>}
              />
            )}
          </DashboardSection>

          <DashboardSection title="إجراء سريع" detail="ابدأ من الخدمة التي تحتاجها.">
            <div className="grid gap-3">
              <Link to="/booking" className="group flex min-h-16 items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/60">
                <span className="font-bold">حجز استشارة جديدة</span>
                <span aria-hidden="true" className="text-xl text-teal-700 transition group-hover:-translate-x-1">←</span>
              </Link>
              <Link to="/booking/appointments" className="group flex min-h-16 items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/60">
                <span className="font-bold">عرض سجل مواعيدي</span>
                <span aria-hidden="true" className="text-xl text-teal-700 transition group-hover:-translate-x-1">←</span>
              </Link>
              <Link to="/profile" className="group flex min-h-16 items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/60">
                <span className="font-bold">تحديث بيانات الحساب</span>
                <span aria-hidden="true" className="text-xl text-teal-700 transition group-hover:-translate-x-1">←</span>
              </Link>
            </div>
          </DashboardSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardSection title="آخر المواعيد" detail="أحدث الحجوزات المسجلة في حسابك.">
            {loading ? (
              <div role="status" aria-label="جار تحميل المواعيد" className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ) : dataError ? (
              <DashboardEmptyState title="تعذر تحميل سجل المواعيد" detail="أعد تحميل الصفحة بعد التحقق من اتصالك وصلاحيات القراءة." />
            ) : history.length ? (
              <div className="divide-y divide-slate-100">
                {history.slice(0, 4).map((appointment) => (
                  <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800">{appointment.doctorName}</p>
                      <p className="mt-1 text-sm text-slate-500">{appointment.serviceName} · {formatDashboardDate(appointment.date)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{appointmentStatusLabels[appointment.status] ?? appointment.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState title="سجل المواعيد فارغ" detail="ستجد تفاصيل مواعيدك السابقة والقادمة هنا." />
            )}
          </DashboardSection>

          <DashboardSection title="الوصفات الطبية" detail="المعلومات المسجلة من الفريق الطبي لحسابك.">
            {loading ? (
              <div role="status" aria-label="جار تحميل الوصفات" className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ) : dataError ? (
              <DashboardEmptyState title="تعذر تحميل الوصفات" detail="لا يمكن تأكيد خلو الملف من الوصفات حتى تكتمل قراءة بيانات Firebase." />
            ) : latestPrescription ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{latestPrescription.doctorName}</p>
                    <p className="mt-1 text-xs text-slate-500">تاريخ الوصفة: {formatDashboardDate(latestPrescription.createdAt.slice(0, 10))}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">وصفة مسجلة</span>
                </div>
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <div><p className="text-xs font-semibold text-slate-500">التشخيص</p><p className="mt-1 text-sm leading-6 text-slate-800">{latestPrescription.diagnosis}</p></div>
                  <div><p className="text-xs font-semibold text-slate-500">الأدوية والتعليمات</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{latestPrescription.medications}</p></div>
                </div>
              </div>
            ) : (
              <DashboardEmptyState title="لا توجد وصفات مسجلة" detail="ستظهر الوصفة هنا بعد أن يضيفها الطبيب إلى موعد مرتبط بحسابك." />
            )}
          </DashboardSection>
        </div>

        <DashboardSection title="التخصصات المتاحة" detail="اختر تخصصاً للانتقال إلى الأطباء المتاحين في كتالوج الحجز.">
          {specialties.length ? (
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <Link key={specialty.id} to={`/booking?specialty=${encodeURIComponent(specialty.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800">
                  <span aria-hidden="true">{specialty.icon}</span>{specialty.arabicName}
                </Link>
              ))}
            </div>
          ) : (
            <DashboardEmptyState title="لا توجد تخصصات متاحة حالياً" detail="لا يعرض التطبيق تخصصات غير موجودة في كتالوج قاعدة البيانات." />
          )}
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
