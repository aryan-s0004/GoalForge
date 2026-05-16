import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Edit3, Target, XCircle } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { approveGoal, editGoalBeforeApprove, getPendingApprovals, rejectGoal } from '../lib/api.js';

export default function ManagerDashboard({ user }) {
  const [pending, setPending] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [editing, setEditing] = useState({});
  const [message, setMessage] = useState('');

  const loadPending = async () => {
    const response = await getPendingApprovals();
    setPending(response.data);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const runAction = async (action, success) => {
    setMessage('');
    try {
      await action();
      await loadPending();
      setMessage(success);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Action failed');
    }
  };

  return (
    <Layout user={user} roleLabel="Manager approvals">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forge">Team queue</p>
          <h1 className="mt-1 text-3xl font-black text-ink">Pending approvals</h1>
        </div>
        <div className="panel flex items-center gap-3 rounded-lg px-4 py-3">
          <ClipboardList className="text-forge" size={22} />
          <span className="text-2xl font-black text-ink">{pending.length}</span>
        </div>
      </section>

      {message && <p className="mb-5 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">{message}</p>}

      <section className="grid gap-4 lg:grid-cols-2">
        {pending.map((goal) => (
          <article key={goal.id} className="panel rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{goal.profiles?.full_name || goal.profiles?.email}</p>
                <h2 className="mt-1 text-xl font-black text-ink">{goal.title}</h2>
              </div>
              <Target className="text-forge" size={24} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{goal.description || 'No description added.'}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info label="Thrust" value={goal.thrust_area} />
              <Info label="Target" value={`${goal.target_value} ${goal.uom}`} />
              <Info label="Weightage" value={`${goal.weightage}%`} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input
                className="field"
                type="number"
                placeholder="Target"
                value={editing[goal.id]?.target_value ?? goal.target_value}
                onChange={(e) => setEditing({ ...editing, [goal.id]: { ...editing[goal.id], target_value: e.target.value } })}
              />
              <input
                className="field"
                type="number"
                placeholder="Weightage"
                value={editing[goal.id]?.weightage ?? goal.weightage}
                onChange={(e) => setEditing({ ...editing, [goal.id]: { ...editing[goal.id], weightage: e.target.value } })}
              />
            </div>
            <textarea
              className="field mt-3"
              rows="2"
              placeholder="Feedback for rejection"
              value={feedback[goal.id] || ''}
              onChange={(e) => setFeedback({ ...feedback, [goal.id]: e.target.value })}
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => runAction(() => editGoalBeforeApprove(goal.id, editing[goal.id] || goal), 'Goal updated.')} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-700">
                <Edit3 size={17} /> Save Edit
              </button>
              <button type="button" onClick={() => runAction(() => rejectGoal(goal.id, feedback[goal.id]), 'Goal rejected.')} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-bold text-white">
                <XCircle size={17} /> Reject
              </button>
              <button type="button" onClick={() => runAction(() => approveGoal(goal.id), 'Goal approved.')} className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2 font-bold text-white">
                <CheckCircle2 size={17} /> Approve
              </button>
            </div>
          </article>
        ))}
      </section>

      {!pending.length && (
        <section className="panel rounded-lg p-10 text-center">
          <CheckCircle2 className="mx-auto text-mint" size={44} />
          <p className="mt-3 font-semibold text-slate-500">No submitted goals are waiting for review.</p>
        </section>
      )}
    </Layout>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-800">{value}</p>
    </div>
  );
}
