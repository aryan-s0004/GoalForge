import { LogOut, Target } from 'lucide-react';

export default function Layout({ user, roleLabel, children }) {
  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge text-white">
              <Target size={22} />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight text-ink">GoalForge</p>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{user.name || user.email}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
