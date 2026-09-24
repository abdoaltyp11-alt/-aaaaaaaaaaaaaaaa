import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';

const stats = [
  { value: '1200+', label: 'مريض' },
  { value: '180+', label: 'طبيب' },
  { value: '24/7', label: 'دعم' },
];

const features = [
  { title: 'حجوزات ذكية', description: 'جدولة مواعيد سريعة مع متابعة فورية عبر المنصة.' },
  { title: 'استشارات فيديو', description: 'جلسات رقمية آمنة بين المرضى والأطباء في وقت واحد.' },
  { title: 'تتبع صحي', description: 'إدارة الفحوصات، الروشتات، والملاحظات الطبية بسهولة.' },
  { title: 'رعاية منزلية', description: 'خدمات تمريض ومتابعة صحية متكاملة داخل المنزل.' },
];

const steps = [
  { number: '01', title: 'سجل حسابك', text: 'أنشئ ملفك الشخصي في دقائق' },
  { number: '02', title: 'اختر الخدمة', text: 'اختر الطبيب أو التخصص المناسب' },
  { number: '03', title: 'ابدأ العلاج', text: 'تابع المواعيد والروشتات والدفعات' },
];

export default function LandingPage() {
  return (
    <div className="app-shell page-gradient">
      <header className="mx-auto max-w-7xl px-4 pt-6">
        <nav className="flex items-center justify-between rounded-full border border-white/60 bg-white/75 px-4 py-3 shadow-[0_10px_30px_rgba(15,118,110,0.08)] backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-medical-600 text-lg font-bold text-white shadow-lg shadow-brand-500/20">
              +
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">{APP_NAME}</div>
              <div className="text-[10px] text-slate-500">رعاية صحية رقمية</div>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-brand-700">الخدمات</a>
            <a href="#steps" className="transition hover:text-brand-700">كيف يعمل</a>
            <a href="#about" className="transition hover:text-brand-700">من نحن</a>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/auth/login" className="btn-secondary hidden sm:inline-flex">
              تسجيل الدخول
            </Link>
            <Link to="/auth/register" className="btn-primary">
              ابدأ الآن
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 md:pt-14">
        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
              منصة رعاية صحية رقمية
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-tight text-slate-900 md:text-5xl lg:text-6xl">
              تجربة صحية متكاملة <span className="text-brand-700">للمرضى والأطباء</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              رعاية صحية موثوقة، مواعيد ذكية، متابعة طبية فورية، واستشارات آمنة من خلال منصة حديثة ومصممة لتسهيل حياة الجميع.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth/register" className="btn-primary">
                إنشاء حساب
              </Link>
              <Link to="/auth/login" className="btn-secondary">
                تسجيل الدخول
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="card p-4 text-center">
                  <div className="text-2xl font-black text-brand-700">{item.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-brand-200/60 blur-3xl" />
            <div className="absolute -right-6 bottom-5 h-24 w-24 rounded-full bg-medical-200/70 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-brand-100 bg-gradient-to-br from-brand-700 via-brand-600 to-medical-600 p-5 text-white shadow-[0_30px_80px_rgba(15,118,110,0.28)]">
              <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/80">مواعيد اليوم</div>
                    <div className="mt-1 text-2xl font-bold">14 زيارة</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl">🩺</div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>د. سارة علي</span>
                      <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-100">متاحة</span>
                    </div>
                    <div className="mt-2 text-xs text-white/80">10:30 صباحاً • الطوارئ</div>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>د. محمد حسن</span>
                      <span className="rounded-full bg-amber-400/20 px-2 py-1 text-xs text-amber-100">قيد الانتظار</span>
                    </div>
                    <div className="mt-2 text-xs text-white/80">12:15 ظهراً • استشارة</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-lg font-bold">96%</div>
                    <div className="text-[10px] text-white/75">رضا المرضى</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-lg font-bold">4.9</div>
                    <div className="text-[10px] text-white/75">تقييم</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-lg font-bold">2k</div>
                    <div className="text-[10px] text-white/75">متابع</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">ماذا نقدم</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">حلول صحية متكاملة لكل خطوة</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="card p-5 transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,118,110,0.10)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-medical-100 text-2xl">
                  {feature.title.includes('حجوز') ? '📅' : feature.title.includes('استش') ? '💬' : feature.title.includes('تتبع') ? '📋' : '🏠'}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="steps" className="mt-20 rounded-[32px] border border-slate-200 bg-white/80 p-6 md:p-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">كيف يعمل</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">ابدأ بالعناية الصحيّة في 3 خطوات فقط</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-black text-white shadow-lg shadow-brand-500/20">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="mt-20 rounded-[32px] border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-medical-50 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold text-brand-700">لماذا نحن</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">منصة صحية عملية، موثوقة، ومصممة للراحة</h2>
            </div>
            <div className="text-lg leading-8 text-slate-600">
              نعمل على توحيد خدمات الرعاية الطبية في واجهة واحدة تتيح للحجز، المتابعة، والتواصل، والمعلومات الصحية في مكان واحد.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
