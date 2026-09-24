import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithGoogle, signInWithFacebook, pendingGoogleUser, chooseGoogleRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await signIn(emailOrPhone, password);
      const normalized = emailOrPhone.toLowerCase();
      const target = normalized.includes('admin')
        ? '/admin'
        : normalized.includes('doctor') || normalized.includes('طبيب')
          ? '/doctor'
          : '/patient';
      navigate(target, { replace: true });
    } catch {
      // UI error state can be added later.
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/patient', { replace: true });
    } catch (authError) {
      const errorCode = authError instanceof Error && 'code' in authError ? String(authError.code) : '';
      setError(errorCode === 'auth/unauthorized-domain'
        ? `النطاق ${window.location.hostname} غير مصرح به في Firebase. أضفه من Authorized domains.`
        : errorCode === 'auth/operation-not-allowed'
          ? 'Google غير مفعّل في Firebase. فعّله من Authentication ثم Sign-in method ثم Google.'
          : errorCode === 'auth/popup-blocked'
            ? 'المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى.'
            : errorCode === 'auth/popup-closed-by-user'
              ? 'تم إغلاق نافذة Google قبل إكمال تسجيل الدخول.'
              : errorCode === 'auth/cancelled-popup-request'
                ? 'يوجد تسجيل Google آخر قيد التنفيذ. أغلق النافذة السابقة ثم حاول مرة واحدة.'
          : errorCode === 'PERMISSION_DENIED' || errorCode === 'database/permission-denied'
            ? 'تم تسجيل Google، لكن Firebase Rules تمنع قراءة users/{uid}. انشر database.rules.json أولًا.'
          : 'تعذر فتح تسجيل Google. راجع Authorized domains وتفعيل Google في Firebase.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRole = async (role: 'PATIENT' | 'DOCTOR' | 'NURSE') => {
    try {
      await chooseGoogleRole(role);
      navigate(role === 'PATIENT' ? '/patient' : role === 'DOCTOR' ? '/doctor' : '/nurse', { replace: true });
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'لا يمكن تفعيل هذا الدور من الواجهة.');
    }
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    setError('');
    try {
      await signInWithFacebook();
    } catch {
      setError('لم يكتمل تسجيل الدخول عبر Facebook. فعّل Facebook من Firebase ثم حاول مرة أخرى.');
    } finally {
      setFacebookLoading(false);
    }
  };

  if (pendingGoogleUser) {
    return (
      <div className="app-shell page-gradient flex items-center justify-center px-4 py-10">
        <div className="card w-full max-w-lg p-8 text-center">
          <img src={pendingGoogleUser.avatarUrl} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
          <h1 className="mt-5 text-2xl font-black text-slate-900">اختار نوع حسابك</h1>
          <p className="mt-2 text-sm text-slate-500">أهلاً {pendingGoogleUser.fullName}، اختر الدور المناسب لحسابك.</p>
          <div className="mt-6 grid gap-3">
            <button type="button" className="btn-primary w-full" onClick={() => void handleGoogleRole('PATIENT')}>مريض</button>
            <button type="button" className="btn-secondary w-full" onClick={() => void handleGoogleRole('DOCTOR')}>دكتور</button>
            <button type="button" className="btn-secondary w-full" onClick={() => void handleGoogleRole('NURSE')}>ممرض</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell page-gradient flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 shadow-[0_30px_80px_rgba(15,118,110,0.10)] backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-gradient-to-br from-brand-700 via-brand-600 to-medical-600 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              +
            </div>
            <h1 className="text-3xl font-black">مرحباً بعودتك</h1>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/80">
              تابع مواعيدك، تواصل مع فريق الرعاية، واستفد من خدمات صحية متكاملة في مكان واحد.
            </p>
          </div>

          <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur-sm">
            <div className="text-sm text-white/80">معدل الرضا</div>
            <div className="mt-2 text-3xl font-black">96%</div>
            <div className="mt-2 text-xs text-white/75">مستوى الثقة من المرضى خلال العام الماضي</div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-700">
              🩺
            </div>
            <h2 className="text-3xl font-black text-slate-900">تسجيل الدخول</h2>
            <p className="mt-2 text-sm text-slate-500">أدخل بيانات حسابك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">الهاتف أو البريد الإلكتروني</label>
              <input
                className="input"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="example@domain.com"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/auth/register" className="text-brand-600 hover:underline">
                إنشاء حساب جديد
              </Link>
              <button type="button" className="text-slate-500 hover:text-slate-800">
                نسيت كلمة المرور؟
              </button>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>

            <div className="relative py-1 text-center text-xs text-slate-400">
              <span className="relative z-10 bg-white px-3">أو</span>
              <div className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.88-1.73 2.99-4.28 2.99-7.4Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.22-2.51c-.89.6-2.02.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.05v2.59A9.98 9.98 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.38 13.87A6 6 0 0 1 6.07 12c0-.65.11-1.28.31-1.87V7.54H3.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.05 4.46l3.33-2.59Z" />
                <path fill="#EA4335" d="M12 6c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2.99 14.7 2 12 2a9.98 9.98 0 0 0-8.95 5.54l3.33 2.59C7.17 7.76 9.39 6 12 6Z" />
              </svg>
              {googleLoading ? 'جاري فتح Google...' : 'تسجيل الدخول باستخدام Google'}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-blue-200 bg-[#1877F2] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleFacebookSignIn}
              disabled={facebookLoading}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-[#1877F2]">f</span>
              {facebookLoading ? 'جاري فتح Facebook...' : 'تسجيل الدخول باستخدام Facebook'}
            </button>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
