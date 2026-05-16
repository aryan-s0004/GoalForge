import { BarChart3, Command, GitBranch, LogOut, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const roleMeta = {
  employee: { icon: Sparkles, label: 'Momentum' },
  manager: { icon: Command, label: 'Command' },
  admin: { icon: GitBranch, label: 'Alignment' }
};

export default function Layout({ roleLabel, children }) {
  const { user, logout } = useAuth();
  const MetaIcon = roleMeta[user?.role]?.icon || BarChart3;

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/82 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forge text-white shadow-lg shadow-indigo-500/30">
              <Target size={22} />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-tight text-white">GoalForge</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 md:flex">
              <MetaIcon size={16} className="text-indigo-300" />
              {roleMeta[user.role]?.label || 'Workspace'}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{user.name || user.email}</p>
              <p className="text-xs font-medium text-slate-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-200"
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
