import { useNavigate, Link } from 'react-router-dom';

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
  const roleColor = user?.role === 'admin' ? 'bg-destructive/10 text-destructive' : user?.role === 'manager' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-border backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-bold text-base">
              <div className="h-7 w-7 rounded-md gradient-brand-bg flex items-center justify-center">
                <span className="text-white text-xs font-extrabold">G</span>
              </div>
              GoalForge
            </Link>
            {user && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${roleColor}`}>
                {roleLabel}
              </span>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium leading-tight">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <div className="h-8 w-8 rounded-full gradient-brand-bg flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
              <button
                onClick={logout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
