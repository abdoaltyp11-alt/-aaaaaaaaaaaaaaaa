import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'CONSULTANT' | 'NURSE'>('PATIENT');
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleNext = async () => {
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || password.length < 6 || password !== confirmPassword) {
        setError('أكمل البيانات وتأكد أن كلمة المرور متطابقة ولا تقل عن 6 أحرف.');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    try {
      await signUp({ fullName, email, phone, password, role });
      navigate('/patient', { replace: true });
    } catch (registrationError) {
      const errorCode = registrationError instanceof Error && 'code' in registrationError ? String(registrationError.code) : '';
      setError(errorCode === 'auth/email-already-in-use'
        ? 'هذا البريد مستخدم بالفعل. استخدم تسجيل الدخول أو بريدًا آخر.'
        : errorCode === 'auth/operation-not-allowed'
          ? 'تسجيل البريد وكلمة المرور غير مفعّل في Firebase. فعّله من Authentication ثم Sign-in method.'
          : errorCode === 'auth/invalid-email'
            ? 'صيغة البريد الإلكتروني غير صحيحة.'
            : errorCode === 'auth/weak-password'
              ? 'كلمة المرور ضعيفة. استخدم 6 أحرف أو أكثر.'
              : registrationError instanceof Error ? registrationError.message : 'تعذر إنشاء الحساب.' );
    }
  };

  return (
    <div className="app-shell page-gradient flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,118,110,0.10)] backdrop-blur md:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-700">
            ✨
          </div>
          <h1 className="text-3xl font-black text-slate-900">إنشاء حساب جديد</h1>
          <p className="mt-2 text-sm text-slate-500">الخطوة {step} من 3</p>
        </div>

        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-2 flex-1 rounded-full ${step >= item ? 'bg-gradient-to-r from-brand-600 to-medical-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="label">الاسم الكامل</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: أحمد محمد" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                </div>
                <div>
                  <label className="label">رقم الهاتف</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9665********" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">كلمة المرور</label>
                  <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">تأكيد كلمة المرور</label>
                  <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">📷</div>
              <label className="label mb-0 justify-center">إضافة صورة الملف الشخصي</label>
              <input type="file" className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600" accept="image/*" />
              <p className="mt-4 text-xs text-slate-500">سيتم دعم رفع الملف لاحقًا مع التخزين الآمن.</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="label">اختر نوع الحساب</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['PATIENT', 'مريض'],
                  ['DOCTOR', 'طبيب'],
                  ['CONSULTANT', 'استشاري'],
                  ['NURSE', 'ممرض'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value as typeof role)}
                    className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium transition ${
                      role === value ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link to="/auth/login" className="text-sm text-slate-500 hover:text-slate-800">
              لديك حساب؟ تسجيل الدخول
            </Link>
            <button type="button" onClick={handleNext} className="btn-primary">
              {step === 3 ? 'إنشاء الحساب' : 'التالي'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
