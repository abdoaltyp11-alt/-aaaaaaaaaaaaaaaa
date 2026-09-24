import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';

export default function AdminDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="app-shell px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="card mb-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">لوحة الإدارة</h1>
              <p className="mt-2 text-slate-600">{user?.fullName ?? 'مدير النظام'}</p>
            </div>
            <button type="button" className="btn-primary" onClick={handleLogout}>تسجيل الخروج</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="card p-4"><h2 className="text-sm text-slate-500">المستخدمون</h2><p className="mt-2 text-3xl font-bold text-slate-900">1,248</p></div>
          <div className="card p-4"><h2 className="text-sm text-slate-500">الحجوزات</h2><p className="mt-2 text-3xl font-bold text-slate-900">482</p></div>
          <div className="card p-4"><h2 className="text-sm text-slate-500">التحقق</h2><p className="mt-2 text-3xl font-bold text-slate-900">95%</p></div>
          <div className="card p-4"><h2 className="text-sm text-slate-500">التقييمات</h2><p className="mt-2 text-3xl font-bold text-slate-900">4.8</p></div>
        </div>
      </div>
    </div>
  );
}
