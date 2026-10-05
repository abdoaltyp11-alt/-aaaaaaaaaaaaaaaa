import { Link } from 'react-router-dom';
import { DashboardEmptyState, DashboardLayout, DashboardSection } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/AuthProvider';

export default function ConsultantDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout role="CONSULTANT" eyebrow="الخدمات الطبية" title={`مرحباً، ${user?.fullName || 'بك'}`}>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-l from-indigo-950 via-indigo-900 to-teal-900 p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-bold text-indigo-200">مساحة الاستشاري</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">معلومات حسابك وخدمات التطبيق</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">تعرض هذه اللوحة الوظائف المرتبطة فعلياً بحساب الاستشاري، من دون اختلاق جلسات أو إحالات.</p>
        </section>
        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardSection title="الجلسات والإحالات" detail="مصادر المواعيد الحالية لا توفر قائمة جلسات خاصة بدور الاستشاري.">
            <DashboardEmptyState title="لا توجد جلسات مرتبطة بهذا الحساب" detail="عند إسناد جلسات إلى الاستشاري في قاعدة البيانات وإتاحتها بقواعد القراءة، ستظهر هنا." />
          </DashboardSection>
          <DashboardSection title="إجراءات الحساب">
            <div className="grid gap-3">
              <Link to="/profile" className="flex min-h-16 items-center justify-between rounded-xl border border-slate-200 p-4 font-semibold transition hover:border-teal-300 hover:bg-teal-50/60">
                تحديث الملف الشخصي <span aria-hidden="true" className="text-teal-700">←</span>
              </Link>
              <Link to="/consultant" className="flex min-h-16 items-center justify-between rounded-xl border border-slate-200 p-4 font-semibold transition hover:border-teal-300 hover:bg-teal-50/60">
                العودة إلى لوحة الاستشاري <span aria-hidden="true" className="text-teal-700">←</span>
              </Link>
            </div>
          </DashboardSection>
        </div>
      </div>
    </DashboardLayout>
  );
}
