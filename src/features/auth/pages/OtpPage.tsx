import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';

export default function OtpPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtp, user, session } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await verifyOtp(otp);
      const target = user?.role === 'ADMIN' ? '/admin' : '/patient';
      navigate(target, { replace: true });
    } catch {
      // OTP validation can be surfaced here in a later step.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell page-gradient flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,118,110,0.10)] backdrop-blur md:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-700">
            🔐
          </div>
          <h1 className="text-3xl font-black text-slate-900">تأكيد الحساب</h1>
          <p className="mt-2 text-sm text-slate-500">أدخل رمز التحقق المرسل إلى هاتفك أو بريدك</p>
        </div>

        <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-center text-sm text-brand-700">
          رمز التحقق التجريبي: <span className="font-black">{session?.verificationCode ?? '123456'}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">رمز التحقق</label>
            <input
              className="input text-center text-xl tracking-[0.5em]"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="######"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <button type="button" className="text-brand-600 hover:underline">
              إعادة إرسال الرمز
            </button>
            <span className="text-slate-500">تنتهي صلاحية الرمز خلال 5 دقائق</span>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تأكيد الحساب'}
          </button>
        </form>
      </div>
    </div>
  );
}
