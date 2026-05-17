import { useNavigate, Link } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const roleLabel = user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1);
  const roleColor = user?.role === 'admin' 
    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
    : user?.role === 'manager' 
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sticky Premium Top Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 font-extrabold text-base text-slate-100 tracking-tight">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white text-sm font-black">G</span>
              </div>
              <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                GoalForge
              </span>
            </Link>
            {user && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${roleColor}`}>
                {roleLabel}
              </span>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-4">
              
              {/* Notification Center Center Bell */}
              <NotificationCenter />

              <div className="h-6 w-[1px] bg-slate-900 hidden sm:block" />

              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200 leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</div>
              </div>
              
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-extrabold shadow-md shadow-indigo-600/10">
                {user.name?.charAt(0) || 'U'}
              </div>

              <button
                onClick={logout}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>

      {/* Corporate footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-[10px] text-slate-600 font-mono">
        © 2026 GoalForge Inc. Enterprise OKR Assurance Platform. All audits secured.
      </footer>
    </div>
  );
}
