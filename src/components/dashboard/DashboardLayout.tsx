import { ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';
import { BASE_PATHS } from '@/lib/constants';
import { Role } from '@/types/user';

type NavigationItem = {
  label: string;
  to: string;
  end?: boolean;
};

const roleLabels: Record<Role, string> = {
  ADMIN: 'إدارة النظام',
  CONSULTANT: 'مساحة الاستشاري',
  DOCTOR: 'مساحة الطبيب',
  NURSE: 'مساحة التمريض',
  PATIENT: 'الرعاية الصحية',
};

const navigation: Record<Role, NavigationItem[]> = {
  ADMIN: [{ label: 'نظرة عامة', to: '/admin', end: true }],
  CONSULTANT: [{ label: 'نظرة عامة', to: '/consultant', end: true }],
  DOCTOR: [{ label: 'نظرة عامة والمواعيد', to: '/doctor', end: true }],
  NURSE: [{ label: 'نظرة عامة والمواعيد', to: '/nurse', end: true }],
  PATIENT: [
    { label: 'الرئيسية', to: '/patient', end: true },
    { label: 'مواعيدي', to: '/booking/appointments' },
    { label: 'حجز موعد', to: '/booking' },
  ],
};

function UserAvatar({ fullName, avatarUrl }: { fullName: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-10 w-10 rounded-2xl object-cover" />;
  }

  return (
    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 font-bold text-teal-800">
      {fullName.trim().charAt(0) || 'م'}
    </span>
  );
}

export function DashboardLayout({
  role,
  title,
  eyebrow,
  children,
}: {
  role: Role;
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const name = user?.fullName || 'مستخدم';
  const links = navigation[role];

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  const navigationLinks = (mobile = false) => links.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      aria-current={location.pathname === item.to ? 'page' : undefined}
      className={({ isActive }) => [
        'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition',
        isActive
          ? 'bg-teal-50 text-teal-800'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        mobile ? 'flex-1 flex-col justify-center gap-1 px-1 py-2 text-[11px]' : '',
      ].join(' ')}
    >
      <span aria-hidden="true" className="text-base">{item.label === 'حجز موعد' ? '+' : item.label.includes('موعد') ? '▦' : '⌂'}</span>
      <span>{item.label}</span>
    </NavLink>
  ));

  return (
    <div className="min-h-screen bg-[#f5f8f8] text-slate-900">
      <aside className="fixed inset-y-0 right-0 z-20 hidden w-64 flex-col border-l border-slate-200 bg-white lg:flex">
        <Link to={BASE_PATHS[role]} className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-xl font-black text-white">+</span>
          <span>
            <span className="block text-lg font-black tracking-tight">صحيحتي</span>
            <span className="block text-xs text-slate-500">{roleLabels[role]}</span>
          </span>
        </Link>

        <nav aria-label="التنقل الرئيسي" className="flex-1 space-y-1 px-4 py-6">
          {navigationLinks()}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <Link to="/profile" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50">
            <UserAvatar fullName={name} avatarUrl={user?.avatarUrl} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{name}</span>
              <span className="block text-xs text-slate-500">الملف الشخصي</span>
            </span>
            <span aria-hidden="true" className="text-slate-400">‹</span>
          </Link>
          <button type="button" className="mt-2 min-h-11 w-full rounded-xl px-3 text-right text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700" onClick={handleLogout}>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:mr-64">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-lg font-black text-white">+</span>
              <div>
                <div className="font-black">صحيحتي</div>
                <div className="text-xs text-slate-500">{roleLabels[role]}</div>
              </div>
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-bold text-teal-700">{eyebrow}</p>
              <h1 className="mt-1 truncate text-lg font-bold text-slate-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-right transition hover:bg-slate-50 lg:hidden">
                <UserAvatar fullName={name} avatarUrl={user?.avatarUrl} />
                <span className="hidden max-w-36 truncate text-sm font-semibold sm:inline">{name}</span>
              </Link>
              <button type="button" aria-label="تسجيل الخروج" className="min-h-10 rounded-xl px-3 text-xs font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 lg:hidden" onClick={handleLogout}>
                خروج
              </button>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-bold">{name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mb-6 sm:hidden">
            <p className="text-xs font-bold text-teal-700">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-black">{title}</h1>
          </div>
          {children}
        </main>
      </div>

      <nav aria-label="التنقل على الهاتف" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
        {navigationLinks(true)}
        <Link to="/profile" className="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold text-slate-600">
          <span aria-hidden="true" className="text-base">◉</span>
          الملف الشخصي
        </Link>
      </nav>
    </div>
  );
}

export function DashboardStat({
  label,
  value,
  detail,
  isLoading = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  isLoading?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {isLoading ? (
        <div role="status" aria-label={`جار تحميل ${label}`} className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      )}
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </section>
  );
}

export function DashboardSection({
  title,
  detail,
  action,
  children,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardEmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center">
      <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-teal-700 shadow-sm">＋</div>
      <h3 className="mt-4 font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function DashboardError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
      {message}
    </div>
  );
}

export function formatDashboardDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatDashboardTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export const todayDateKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export const appointmentStatusLabels: Record<string, string> = {
  cancelled: 'ملغي',
  completed: 'مكتمل',
  confirmed: 'مؤكد',
  in_progress: 'جارٍ الآن',
  no_show: 'لم يحضر',
  payment_failed: 'تعذر الدفع',
  pending_payment: 'بانتظار الدفع',
  rescheduled: 'أعيدت جدولته',
};
