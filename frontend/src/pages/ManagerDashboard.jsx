import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Edit3, Flame, Radar, Target, Users, XCircle } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { approveGoal, editGoalBeforeApprove, getPendingApprovals, rejectGoal } from '../lib/api.js';

export default function ManagerDashboard() {
  const [pending, setPending] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [editing, setEditing] = useState({});
  const [message, setMessage] = useState('');

  const loadPending = async () => {
    try {
      const response = await getPendingApprovals();
      setPending(response.data);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to load approvals. Check that the backend API is running.');
    }
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
    <Layout roleLabel="Manager Command">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-200">Command center</p>
          <h1 className="mt-2 text-4xl font-extrabold text-white">Team performance cockpit</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">Review goal requests, spot workload risk, and keep the team operating at a sustainable pace.</p>
        </div>
        <div className="premium-card flex items-center gap-3 rounded-xl px-4 py-3">
          <ClipboardList className="text-indigo-300" size={22} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Approval inbox</p>
            <span className="text-2xl font-black text-white">{pending.length}</span>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TeamRadar />
        <BurnoutHeatmap pendingCount={pending.length} />
      </section>

      {message && <p className="mb-5 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100 shadow-sm">{message}</p>}

      <section className="grid gap-4 lg:grid-cols-2">
        {pending.map((goal) => (
          <article key={goal.id} className="premium-card rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-400">{goal.profiles?.full_name || goal.profiles?.email}</p>
                <h2 className="mt-1 text-xl font-black text-white">{goal.title}</h2>
              </div>
              <Target className="text-indigo-300" size={24} />
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-400">{goal.description || 'No description added.'}</p>
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
              <button type="button" onClick={() => runAction(() => editGoalBeforeApprove(goal.id, { target_value: editing[goal.id]?.target_value ?? goal.target_value, weightage: editing[goal.id]?.weightage ?? goal.weightage }), 'Goal updated.')} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-bold text-slate-200 hover:border-white/25">
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
        <section className="premium-card rounded-xl p-10 text-center">
          <CheckCircle2 className="mx-auto text-emerald-300" size={44} />
          <p className="mt-3 font-semibold text-slate-400">No submitted goals are waiting for review.</p>
        </section>
      )}
    </Layout>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-100">{value}</p>
    </div>
  );
}

function TeamRadar() {
  const points = [
    [100, 22],
    [168, 70],
    [142, 150],
    [58, 150],
    [32, 70]
  ];
  const polygon = points.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <section className="premium-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-200">Team radar</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">Velocity distribution</h2>
        </div>
        <Radar className="text-indigo-300" size={24} />
      </div>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <svg viewBox="0 0 200 180" className="h-56 w-full">
          {[38, 64, 90].map((r) => (
            <polygon key={r} points={`100,${100 - r} ${100 + r * 0.95},${100 - r * 0.3} ${100 + r * 0.6},${100 + r * 0.82} ${100 - r * 0.6},${100 + r * 0.82} ${100 - r * 0.95},${100 - r * 0.3}`} fill="none" stroke="rgba(148,163,184,0.18)" />
          ))}
          <polygon points={polygon} fill="rgba(99,102,241,0.28)" stroke="#818CF8" strokeWidth="3" />
          {points.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#10B981" />)}
        </svg>
        <div className="grid content-center gap-3">
          {['Execution velocity', 'Customer empathy', 'Operational depth', 'Innovation', 'Collaboration'].map((label, index) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-sm font-bold text-slate-300">
                <span>{label}</span>
                <span>{[86, 78, 72, 64, 91][index]}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${[86, 78, 72, 64, 91][index]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BurnoutHeatmap({ pendingCount }) {
  const cells = Array.from({ length: 18 }, (_, index) => {
    const value = (index * 17 + pendingCount * 23) % 100;
    const tone = value > 72 ? 'bg-red-500/70' : value > 48 ? 'bg-amber-400/70' : 'bg-emerald-400/60';
    return { value, tone };
  });

  return (
    <section className="premium-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-200">Burnout heatmap</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">Workload intensity</h2>
        </div>
        <Flame className="text-amber-300" size={24} />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {cells.map((cell, index) => (
          <div key={index} className={`aspect-square rounded-lg ${cell.tone} shadow-lg shadow-black/20`} title={`${cell.value}% load`} />
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Signal icon={Users} label="Team load" value="76%" />
        <Signal icon={Activity} label="Check-ins due" value={pendingCount + 2} />
        <Signal icon={AlertTriangle} label="Risk zones" value={cells.filter((cell) => cell.value > 72).length} />
      </div>
    </section>
  );
}

function Signal({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <Icon className="text-indigo-300" size={18} />
      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}
