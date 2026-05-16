import { useEffect, useState } from 'react';
import { History, LockOpen, Megaphone, ShieldCheck } from 'lucide-react';
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

export default function AdminDashboard({ user }) {
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sharedGoal, setSharedGoal] = useState(emptySharedGoal);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [goalResponse, logResponse] = await Promise.all([getAdminGoals(), getAuditLogs()]);
    setGoals(goalResponse.data);
    setLogs(logResponse.data);
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
    <Layout user={user} roleLabel="Admin controls">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forge">Administration</p>
          <h1 className="mt-1 text-3xl font-black text-ink">Governance console</h1>
        </div>
        <div className="panel flex items-center gap-3 rounded-lg px-4 py-3">
          <ShieldCheck className="text-forge" size={22} />
          <span className="font-black text-ink">Audit ready</span>
        </div>
      </section>

      {message && <p className="mb-5 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">{message}</p>}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={assignSharedGoal} className="panel rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="text-forge" size={22} />
            <h2 className="text-xl font-black text-ink">Assign shared goal</h2>
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
          <button type="submit" className="mt-4 w-full rounded-lg bg-forge px-4 py-3 font-bold text-white">Assign Goal</button>
        </form>

        <section className="panel rounded-lg p-5">
          <h2 className="mb-4 text-xl font-black text-ink">All goals</h2>
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-500">
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
                  <tr key={goal.id} className="border-t border-slate-100">
                    <td className="py-3 pr-3 font-semibold text-slate-700">{goal.profiles?.full_name || goal.profiles?.email}</td>
                    <td className="py-3 pr-3 text-slate-600">{goal.title}</td>
                    <td className="py-3 pr-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold capitalize">{goal.status}</span></td>
                    <td className="py-3 pr-3 font-bold text-slate-800">{goal.weightage}%</td>
                    <td className="py-3 text-right">
                      <button type="button" onClick={() => unlock(goal.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700">
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

      <section className="panel mt-6 rounded-lg p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="text-forge" size={22} />
          <h2 className="text-xl font-black text-ink">Audit log</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {logs.map((log) => (
            <article key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="font-black text-slate-800">{log.action}</p>
              <p className="text-sm text-slate-600">{log.notes || 'No notes'}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{log.profiles?.email || 'System'} · {new Date(log.created_at).toLocaleString()}</p>
            </article>
          ))}
          {!logs.length && <p className="text-sm font-semibold text-slate-500">No audit events yet.</p>}
        </div>
      </section>
    </Layout>
  );
}
