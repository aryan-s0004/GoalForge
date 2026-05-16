import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, GitBranch, LogIn, ShieldCheck, Sparkles, Target, Users, WifiOff } from 'lucide-react';
import { getHealth, login as apiLogin } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const demoUsers = [
  { email: 'john.employee@atomberg.com', role: 'employee', icon: BriefcaseBusiness },
  { email: 'jane.employee@atomberg.com', role: 'employee', icon: BriefcaseBusiness },
  { email: 'mike.manager@atomberg.com', role: 'manager', icon: Users },
  { email: 'admin@atomberg.com', role: 'admin', icon: ShieldCheck }
];

export default function Login() {
  const [selectedEmail, setSelectedEmail] = useState(demoUsers[0].email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiLogin(selectedEmail);
      login(response.data.user, response.data.token);
      navigate(`/${response.data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen px-4 py-8">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="animate-rise">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-forge text-white shadow-lg shadow-indigo-500/40">
            <Target size={30} />
          </div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-indigo-200">Linear for HR performance</p>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.98] text-white sm:text-6xl">
            High-velocity goals for modern teams.
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-300">
            Replace legacy reviews with a live goal engine for momentum, approvals, alignment, and AI-assisted coaching.
          </p>
          <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ['AI OKRs', Sparkles],
              ['Team radar', Users],
              ['Org alignment', GitBranch]
            ].map(([label, Icon]) => (
              <div key={label} className="premium-card rounded-xl p-4">
                <Icon className="mb-3 text-indigo-300" size={22} />
                <p className="font-bold text-white">{label}</p>
                <p className="mt-1 text-sm text-slate-400">Demo-ready workflow</p>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card animate-rise rounded-xl p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Enter workspace</h2>
              <p className="mt-1 text-sm font-medium text-slate-400">Choose a demo role and launch the product.</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${
              apiStatus === 'online'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : apiStatus === 'offline'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-300 bg-white text-slate-700'
            }`}>
              {apiStatus === 'online' ? <CheckCircle2 size={17} /> : <WifiOff size={17} />}
              API {apiStatus === 'checking' ? 'checking' : apiStatus}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {demoUsers.map((demoUser) => {
              const Icon = demoUser.icon;
              const selected = selectedEmail === demoUser.email;
              return (
                <button
                  key={demoUser.email}
                  type="button"
                  onClick={() => setSelectedEmail(demoUser.email)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selected ? 'border-indigo-400 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/20' : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? 'bg-forge text-white' : 'bg-slate-900 text-slate-300'}`}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-bold text-white">{demoUser.email}</span>
                      <span className="mt-1 inline-block rounded bg-white/10 px-2 py-1 text-xs font-bold capitalize text-slate-300">{demoUser.role}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">{error}</p>}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-forge px-4 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Continue'}
            <ArrowRight size={18} />
          </button>
        </section>
      </main>
    </div>
  );
}
