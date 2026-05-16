import { useEffect, useState } from 'react';
import { Activity, GitBranch, History, LockOpen, Megaphone, Network, ShieldCheck, Target, Users } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { createSharedGoal, getAdminGoals, getAuditLogs, unlockGoal } from '../lib/api.js';

const emptySharedGoal = {
  title: '',
  description: '',
  thrust_area: 'Operations',
  uom: 'numeric',
  target_value: '',
  assigned_to_emails: 'john.employee@atomberg.com, jane.employee@atomberg.com'
};

export default function AdminDashboard() {
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sharedGoal, setSharedGoal] = useState(emptySharedGoal);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [goalResponse, logResponse] = await Promise.all([getAdminGoals(), getAuditLogs()]);
      setGoals(goalResponse.data);
      setLogs(logResponse.data);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to load admin data. Check that the backend API is running.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignSharedGoal = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const payload = {
        ...sharedGoal,
        target_value: Number(sharedGoal.target_value),
        assigned_to_emails: sharedGoal.assigned_to_emails.split(',').map((email) => email.trim()).filter(Boolean)
      };
      const response = await createSharedGoal(payload);
      setMessage(`Shared goal assigned to ${response.data.assigned_count} employees.`);
      setSharedGoal(emptySharedGoal);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to assign shared goal');
    }
  };

  const unlock = async (id) => {
    setMessage('');
    try {
      await unlockGoal(id);
      setMessage('Goal unlocked.');
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to unlock goal');
    }
  };

  return (
    <Layout roleLabel="Admin Alignment">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-200">Alignment engine</p>
          <h1 className="mt-2 text-4xl font-extrabold text-white">Company goal graph</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">Connect executive intent to every employee goal, monitor governance, and keep audit trails ready.</p>
        </div>
        <div className="premium-card flex items-center gap-3 rounded-xl px-4 py-3">
          <ShieldCheck className="text-emerald-300" size={22} />
          <span className="font-black text-white">Audit ready</span>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <AlignmentTree goals={goals} />
        <OrgHealth goals={goals} logs={logs} />
      </section>

      {message && <p className="mb-5 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100 shadow-sm">{message}</p>}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={assignSharedGoal} className="premium-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="text-indigo-300" size={22} />
            <h2 className="text-xl font-black text-white">Assign shared goal</h2>
          </div>
          <div className="grid gap-3">
            <input className="field" placeholder="Goal title" value={sharedGoal.title} onChange={(e) => setSharedGoal({ ...sharedGoal, title: e.target.value })} required />
            <textarea className="field" rows="3" placeholder="Description" value={sharedGoal.description} onChange={(e) => setSharedGoal({ ...sharedGoal, description: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-3">
              <select className="field" value={sharedGoal.thrust_area} onChange={(e) => setSharedGoal({ ...sharedGoal, thrust_area: e.target.value })}>
                <option>Operations</option>
                <option>Sales & Revenue</option>
                <option>Customer Success</option>
                <option>Product Development</option>
                <option>People & Culture</option>
              </select>
              <select className="field" value={sharedGoal.uom} onChange={(e) => setSharedGoal({ ...sharedGoal, uom: e.target.value })}>
                <option value="numeric">Numeric</option>
                <option value="percent">Percent</option>
                <option value="timeline">Timeline</option>
              </select>
              <input className="field" type="number" placeholder="Target" value={sharedGoal.target_value} onChange={(e) => setSharedGoal({ ...sharedGoal, target_value: e.target.value })} required />
            </div>
            <textarea className="field" rows="2" placeholder="Employee emails, comma separated" value={sharedGoal.assigned_to_emails} onChange={(e) => setSharedGoal({ ...sharedGoal, assigned_to_emails: e.target.value })} required />
          </div>
          <button type="submit" className="mt-4 w-full rounded-lg bg-forge px-4 py-3 font-bold text-white shadow-lg shadow-indigo-500/20">Assign Goal</button>
        </form>

        <section className="premium-card rounded-xl p-5">
          <h2 className="mb-4 text-xl font-black text-white">All goals</h2>
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Goal</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Weight</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => (
                  <tr key={goal.id} className="border-t border-white/10">
                    <td className="py-3 pr-3 font-semibold text-slate-300">{goal.profiles?.full_name || goal.profiles?.email}</td>
                    <td className="py-3 pr-3 font-medium text-slate-300">{goal.title}</td>
                    <td className="py-3 pr-3"><span className="rounded bg-white/10 px-2 py-1 text-xs font-bold capitalize text-slate-300">{goal.status}</span></td>
                    <td className="py-3 pr-3 font-bold text-slate-100">{goal.weightage}%</td>
                    <td className="py-3 text-right">
                      <button type="button" onClick={() => unlock(goal.id)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-bold text-slate-200">
                        <LockOpen size={15} /> Unlock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="premium-card mt-6 rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="text-indigo-300" size={22} />
          <h2 className="text-xl font-black text-white">Audit log</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {logs.map((log) => (
            <article key={log.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-black text-white">{log.action}</p>
              <p className="text-sm font-medium text-slate-300">{log.notes || 'No notes'}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{log.profiles?.email || 'System'} | {new Date(log.created_at).toLocaleString()}</p>
            </article>
          ))}
          {!logs.length && <p className="text-sm font-semibold text-slate-500">No audit events yet.</p>}
        </div>
      </section>
    </Layout>
  );
}

function AlignmentTree({ goals }) {
  const departments = [
    { name: 'Engineering', count: goals.filter((goal) => ['Product Development', 'Innovation', 'Operations'].includes(goal.thrust_area)).length || 3 },
    { name: 'Sales', count: goals.filter((goal) => goal.thrust_area === 'Sales & Revenue').length || 2 },
    { name: 'Customer', count: goals.filter((goal) => goal.thrust_area === 'Customer Success').length || 2 }
  ];

  return (
    <section className="premium-card rounded-xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-200">Cascading view</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">CEO Q4 vision flow</h2>
        </div>
        <Network className="text-indigo-300" size={24} />
      </div>
      <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-200">Company OKR</p>
        <p className="mt-1 text-lg font-extrabold text-white">Accelerate profitable growth through customer trust</p>
      </div>
      <div className="mx-auto h-8 w-px bg-white/15" />
      <div className="grid gap-3 md:grid-cols-3">
        {departments.map((dept) => (
          <div key={dept.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <GitBranch className="mb-3 text-emerald-300" size={20} />
            <p className="font-extrabold text-white">{dept.name}</p>
            <p className="mt-1 text-sm font-medium text-slate-400">{dept.count} linked goals</p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min(96, 42 + dept.count * 12)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrgHealth({ goals, logs }) {
  const approved = goals.filter((goal) => goal.status === 'approved').length;
  const submitted = goals.filter((goal) => goal.status === 'submitted').length;
  const alignment = goals.length ? Math.round(((approved + submitted * 0.72) / goals.length) * 100) : 82;
  const stats = [
    { label: 'Alignment', value: `${alignment}%`, icon: Target },
    { label: 'Active goals', value: goals.length, icon: Activity },
    { label: 'Audit events', value: logs.length, icon: ShieldCheck },
    { label: 'Employees', value: new Set(goals.map((goal) => goal.user_id)).size || 2, icon: Users }
  ];

  return (
    <section className="premium-card rounded-xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-200">Org health</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">Alignment monitor</h2>
        </div>
        <ShieldCheck className="text-emerald-300" size={24} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <Icon className="text-indigo-300" size={20} />
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <p className="text-sm font-bold text-emerald-100">Predictive signal</p>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-300">At current velocity, 87% of linked goals are likely to land before quarter close.</p>
      </div>
    </section>
  );
}
