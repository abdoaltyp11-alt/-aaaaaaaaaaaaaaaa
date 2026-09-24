import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await updateUser({ fullName: fullName.trim(), phone: phone.trim() });
    setSaved(true);
  };

  return (
    <div className="app-shell px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to={user.role === 'DOCTOR' ? '/doctor' : '/patient'} className="btn-secondary">رجوع</Link>
          <p className="text-sm font-semibold text-brand-700">بيانات الحساب</p>
        </div>
        <section className="card p-6 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-black text-brand-700">{user.fullName.charAt(0)}</div>}
            <div>
              <h1 className="text-2xl font-black text-slate-900">الملف الشخصي</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">الاسم الكامل</label>
              <input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            </div>
            <div className="flex items-center justify-between gap-3">
              {saved && <span className="text-sm font-medium text-emerald-700">تم حفظ البيانات في الحساب</span>}
              <button type="submit" className="btn-primary mr-auto">حفظ التغييرات</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
