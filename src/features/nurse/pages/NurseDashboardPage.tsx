import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';

export default function NurseDashboardPage() {
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
              <h1 className="text-2xl font-bold text-slate-900">لوحة الممرض</h1>
              <p className="mt-2 text-slate-600">{user?.fullName ?? 'ليلى عادل'}</p>
            </div>
            <button type="button" className="btn-primary" onClick={handleLogout}>تسجيل الخروج</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4"><h2 className="text-sm text-slate-500">الزيارات المنزلية</h2><p className="mt-2 text-3xl font-bold text-slate-900">07</p></div>
          <div className="card p-4"><h2 className="text-sm text-slate-500">الطلبات قيد التنفيذ</h2><p className="mt-2 text-3xl font-bold text-slate-900">15</p></div>
          <div className="card p-4"><h2 className="text-sm text-slate-500">معدل الرضا</h2><p className="mt-2 text-3xl font-bold text-slate-900">98%</p></div>
        </div>
      </div>
    </div>
  );
}
