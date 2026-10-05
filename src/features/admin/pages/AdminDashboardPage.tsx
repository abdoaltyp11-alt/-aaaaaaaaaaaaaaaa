import { Link } from 'react-router-dom';
import { DashboardEmptyState, DashboardLayout, DashboardSection, DashboardStat } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/AuthProvider';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout role="ADMIN" eyebrow="الإدارة والحوكمة" title="نظرة عامة على النظام">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold text-teal-700">مرحباً، {user?.fullName || 'مدير النظام'}</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">لوحة الإدارة</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">ملخص صادق لما هو متاح لحسابك. لا تعرض هذه الصفحة أعداد مستخدمين أو نشاطاً غير مسموح للتطبيق بقراءته.</p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardStat label="الدور الحالي" value="ADMIN" detail="الدور المحفوظ في ملف الحساب المعتمد." />
          <DashboardStat label="إعداد Firebase" value={isFirebaseConfigured ? 'مهيأ' : 'غير مهيأ'} detail="حالة وجود إعدادات Firebase العامة الخاصة بتطبيق الويب، وليست اختبار اتصال." />
        </div>

        <DashboardSection title="إدارة المستخدمين" detail="لا تُجرى تغييرات الأدوار أو حالة الحساب من واجهة العميل.">
          <DashboardEmptyState
            title="إدارة الحسابات غير متاحة من المتصفح حالياً"
            detail="قواعد Realtime Database الحالية لا تسمح بقراءة قائمة users أو تعديل الأدوار من هذا التطبيق. لم نضف صلاحيات عميل أوسع ولم نعرض بيانات غير مصرح بها. يتطلب التفعيل واجهة خلفية موثوقة تتحقق من صلاحية الإدارة."
          />
        </DashboardSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardSection title="مؤشرات النظام" detail="لا توجد حالياً بيانات إدارية مصرح بها لاحتساب مؤشرات حقيقية.">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div><p className="font-semibold text-slate-800">ملف الإدارة</p><p className="mt-1 text-sm text-slate-500">{user?.email || '—'}</p></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">مسجل الدخول</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div><p className="font-semibold text-slate-800">مصدر البيانات</p><p className="mt-1 text-sm text-slate-500">Firebase Realtime Database</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isFirebaseConfigured ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-800'}`}>{isFirebaseConfigured ? 'الإعداد موجود' : 'يحتاج إعداداً'}</span>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection title="أدوات الإدارة" detail="روابط للوظائف المتاحة فعلياً في التطبيق.">
            <div className="grid gap-3">
              <Link to="/profile" className="flex min-h-16 items-center justify-between rounded-xl border border-slate-200 p-4 font-semibold transition hover:border-teal-300 hover:bg-teal-50/60">
                تحديث ملف المدير <span aria-hidden="true" className="text-teal-700">←</span>
              </Link>
              <div className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div><p className="font-semibold text-slate-700">سجل التدقيق</p><p className="mt-1 text-xs text-slate-500">غير متاح للقراءة وفق قواعد قاعدة البيانات الحالية.</p></div>
                <span aria-label="غير متاح" className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">موقوف</span>
              </div>
            </div>
          </DashboardSection>
        </div>
      </div>
    </DashboardLayout>
  );
}
