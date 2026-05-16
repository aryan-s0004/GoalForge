import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, LogIn, ShieldCheck, Target, Users } from 'lucide-react';
import { login } from '../lib/api.js';

const demoUsers = [
  { email: 'john.employee@atomberg.com', role: 'employee', icon: BriefcaseBusiness },
  { email: 'jane.employee@atomberg.com', role: 'employee', icon: BriefcaseBusiness },
  { email: 'mike.manager@atomberg.com', role: 'manager', icon: Users },
  { email: 'admin@atomberg.com', role: 'admin', icon: ShieldCheck }
];

export default function Login({ setUser }) {
  const [selectedEmail, setSelectedEmail] = useState(demoUsers[0].email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await login(selectedEmail);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      navigate(`/${response.data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-lg bg-forge text-white shadow-lg shadow-blue-200">
            <Target size={30} />
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.02] text-ink sm:text-6xl">GoalForge</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            A focused goal setting, approval, shared goal, and audit portal for employee performance planning.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {['8 goal cap', '100% weightage', 'Manager approval'].map((label) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="panel rounded-lg p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-ink">Choose a demo role</h2>
            <p className="mt-1 text-sm text-slate-500">The local demo API is ready with these accounts.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {demoUsers.map((demoUser) => {
              const Icon = demoUser.icon;
              const selected = selectedEmail === demoUser.email;
              return (
                <button
                  key={demoUser.email}
                  type="button"
                  onClick={() => setSelectedEmail(demoUser.email)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selected ? 'border-forge bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? 'bg-forge text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800">{demoUser.email}</span>
                      <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-600">{demoUser.role}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-forge px-4 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </section>
      </main>
    </div>
  );
}
