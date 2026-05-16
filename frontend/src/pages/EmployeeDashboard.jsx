import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Award, CheckCircle2, Lock, Plus, Send, Target, XCircle } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { createGoal, getGoals, submitGoals } from '../lib/api.js';

const emptyGoal = { title: '', description: '', thrust_area: '', uom: 'numeric', target_value: '', weightage: '' };

export default function EmployeeDashboard({ user }) {
  const [goals, setGoals] = useState([]);
  const [goal, setGoal] = useState(emptyGoal);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const totalWeightage = useMemo(() => goals.reduce((sum, item) => sum + Number(item.weightage || 0), 0), [goals]);
  const canSubmit = goals.length > 0 && goals.some((item) => item.status === 'draft') && totalWeightage === 100;
  const canAdd = goals.length < 8 && goals.every((item) => item.status === 'draft');

  const loadGoals = async () => {
    const response = await getGoals();
    setGoals(response.data);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await createGoal(goal);
      setGoal(emptyGoal);
      setShowForm(false);
      await loadGoals();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      await submitGoals();
      await loadGoals();
      setMessage('Goals submitted for manager approval.');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to submit goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} roleLabel="Employee workspace">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forge">My goals</p>
          <h1 className="mt-1 text-3xl font-black text-ink">Quarterly goal plan</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send size={18} /> Submit
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!canAdd}
            className="flex items-center gap-2 rounded-lg bg-forge px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus size={18} /> Add Goal
          </button>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Total Goals" value={`${goals.length}/8`} icon={Target} />
        <Metric label="Weightage" value={`${totalWeightage}%`} icon={Award} tone={totalWeightage === 100 ? 'mint' : 'amber'} />
        <Metric label="Approved" value={goals.filter((item) => item.status === 'approved').length} icon={CheckCircle2} tone="mint" />
        <Metric label="Needs Review" value={goals.filter((item) => item.status === 'rejected').length} icon={AlertCircle} tone="red" />
      </section>

      {message && <p className="mb-5 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">{message}</p>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((item) => (
          <GoalCard key={item.id} goal={item} />
        ))}
      </section>

      {!goals.length && (
        <section className="panel rounded-lg p-10 text-center">
          <Target className="mx-auto text-slate-300" size={44} />
          <p className="mt-3 font-semibold text-slate-500">No goals yet. Create your first one to begin.</p>
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/45 p-4">
          <form onSubmit={handleCreate} className="panel w-full max-w-lg rounded-lg p-6">
            <h2 className="text-xl font-black text-ink">Create goal</h2>
            <div className="mt-4 grid gap-3">
              <input className="field" placeholder="Goal title" value={goal.title} onChange={(e) => setGoal({ ...goal, title: e.target.value })} required />
              <textarea className="field" placeholder="Description" rows="3" value={goal.description} onChange={(e) => setGoal({ ...goal, description: e.target.value })} />
              <select className="field" value={goal.thrust_area} onChange={(e) => setGoal({ ...goal, thrust_area: e.target.value })} required>
                <option value="">Select thrust area</option>
                <option>Sales & Revenue</option>
                <option>Customer Success</option>
                <option>Product Development</option>
                <option>Operations</option>
                <option>People & Culture</option>
                <option>Innovation</option>
              </select>
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="field" value={goal.uom} onChange={(e) => setGoal({ ...goal, uom: e.target.value })}>
                  <option value="numeric">Numeric</option>
                  <option value="percent">Percent</option>
                  <option value="timeline">Timeline</option>
                  <option value="zero">Zero-based</option>
                </select>
                <input className="field" type="number" placeholder="Target" value={goal.target_value} onChange={(e) => setGoal({ ...goal, target_value: e.target.value })} required />
                <input className="field" type="number" min="10" max="100" placeholder="Weight %" value={goal.weightage} onChange={(e) => setGoal({ ...goal, weightage: e.target.value })} required />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600">Cancel</button>
              <button type="submit" disabled={loading} className="rounded-lg bg-forge px-4 py-2 font-bold text-white">Create</button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}

function Metric({ label, value, icon: Icon, tone = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-forge',
    mint: 'bg-emerald-50 text-mint',
    amber: 'bg-amber-50 text-amber',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="panel rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black text-ink">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${colors[tone]}`}>
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}

function GoalCard({ goal }) {
  const status = {
    draft: ['Draft', 'bg-slate-100 text-slate-700', AlertCircle],
    submitted: ['Submitted', 'bg-amber-50 text-amber', AlertCircle],
    approved: ['Approved', 'bg-emerald-50 text-mint', CheckCircle2],
    rejected: ['Rejected', 'bg-red-50 text-red-600', XCircle]
  }[goal.status] || ['Draft', 'bg-slate-100 text-slate-700', AlertCircle];
  const StatusIcon = status[2];

  return (
    <article className="panel rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-black text-ink">{goal.title}</h2>
        {goal.locked && <Lock className="shrink-0 text-slate-400" size={18} />}
      </div>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{goal.description || 'No description added.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${status[1]}`}>
          <StatusIcon size={14} /> {status[0]}
        </span>
        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-forge">{goal.weightage}%</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-slate-500">Thrust area</dt><dd className="font-bold text-slate-800">{goal.thrust_area}</dd></div>
        <div><dt className="text-slate-500">Target</dt><dd className="font-bold text-slate-800">{goal.target_value} {goal.uom}</dd></div>
      </dl>
      {goal.manager_feedback && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{goal.manager_feedback}</p>}
    </article>
  );
}
