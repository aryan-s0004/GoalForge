import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Award, Brain, CheckCircle2, Flame, Gauge, Lock, Plus, Send, Sparkles, Target, TrendingUp, XCircle } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { createGoal, getGoals, submitGoals } from '../lib/api.js';

const emptyGoal = { title: '', description: '', thrust_area: '', uom: 'numeric', target_value: '', weightage: '' };

export default function EmployeeDashboard() {
  const [goals, setGoals] = useState([]);
  const [goal, setGoal] = useState(emptyGoal);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const totalWeightage = useMemo(() => goals.reduce((sum, item) => sum + Number(item.weightage || 0), 0), [goals]);
  const canSubmit = goals.length > 0 && goals.some((item) => item.status === 'draft') && totalWeightage === 100;
  const canAdd = goals.length < 8 && goals.every((item) => item.status === 'draft');
  const approvedCount = goals.filter((item) => item.status === 'approved').length;
  const alignmentScore = Math.min(98, Math.round((totalWeightage || 0) * 0.72 + approvedCount * 9 + goals.length * 4));
  const velocity = goals.length ? Math.round((approvedCount * 100 + goals.filter((item) => item.status === 'submitted').length * 62 + goals.filter((item) => item.status === 'draft').length * 28) / goals.length) : 0;
  const focusGoals = goals.slice(0, 3);

  const loadGoals = async () => {
    try {
      const response = await getGoals();
      setGoals(response.data);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to load goals. Check that the backend API is running.');
    }
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
    <Layout roleLabel="Employee Momentum">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-200">Momentum dashboard</p>
          <h1 className="mt-2 text-4xl font-extrabold text-white">Quarterly operating system</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">Track the goals that matter, keep weightage honest, and turn progress into manager-ready outcomes.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Send size={18} /> Submit
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!canAdd}
            className="flex items-center gap-2 rounded-lg bg-forge px-4 py-2 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Plus size={18} /> Add Goal
          </button>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Active Streak" value={`${Math.max(3, goals.length + 4)}d`} icon={Flame} tone="amber" />
        <Metric label="Alignment Score" value={`${alignmentScore}%`} icon={Gauge} tone={alignmentScore > 75 ? 'mint' : 'blue'} />
        <Metric label="Velocity" value={`${velocity}%`} icon={TrendingUp} tone="blue" />
        <Metric label="Weightage" value={`${totalWeightage}%`} icon={Award} tone={totalWeightage === 100 ? 'mint' : 'amber'} />
      </section>

      {message && <p className="mb-5 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100 shadow-sm">{message}</p>}

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="premium-card rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-200">Focus list</p>
              <h2 className="mt-1 text-2xl font-extrabold text-white">Top 3 high-impact goals</h2>
            </div>
            <Target className="text-indigo-300" size={24} />
          </div>
          <div className="grid gap-3">
            {focusGoals.map((item) => (
              <FocusGoal key={item.id} goal={item} />
            ))}
            {!focusGoals.length && <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-400">Create a goal to activate your focus queue.</p>}
          </div>
        </div>
        <aside className="premium-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">
              <Brain size={22} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-200">AI side-kick</p>
              <h2 className="text-xl font-extrabold text-white">Coaching signal</h2>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium leading-7 text-slate-300">
            {totalWeightage === 100
              ? 'Your plan is submission-ready. Next move: make the top goal more measurable with a stretch target.'
              : `You are ${Math.max(0, 100 - totalWeightage)}% away from a balanced plan. Add weight to priority work before submitting.`}
          </p>
          <div className="mt-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-100">
                <Sparkles size={16} />
                Suggested OKR
              </div>
              <button 
                onClick={() => {
                  setGoal({
                    title: 'Improve cycle time by 18%',
                    description: 'Improve cycle time by 18% while keeping customer-impact defects below 2%.',
                    thrust_area: 'Operations',
                    uom: 'percent',
                    target_value: '18',
                    weightage: '20'
                  });
                  setShowForm(true);
                }}
                disabled={!canAdd}
                className="rounded bg-indigo-500/20 px-2 py-1 text-xs font-bold text-indigo-200 hover:bg-indigo-500/40 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use Suggestion
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-300">Improve cycle time by 18% while keeping customer-impact defects below 2%.</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((item) => (
          <GoalCard key={item.id} goal={item} />
        ))}
      </section>

      {!goals.length && (
        <section className="panel rounded-xl p-10 text-center">
          <Target className="mx-auto text-indigo-300" size={44} />
          <p className="mt-3 font-semibold text-slate-400">No goals yet. Create your first one to begin.</p>
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/45 p-4">
          <form onSubmit={handleCreate} className="panel w-full max-w-lg rounded-xl p-6">
            <h2 className="text-xl font-black text-white">Create goal</h2>
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
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-white/10 px-4 py-2 font-bold text-slate-300">Cancel</button>
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
    blue: 'bg-indigo-500/15 text-indigo-200',
    mint: 'bg-emerald-500/15 text-emerald-200',
    amber: 'bg-amber-500/15 text-amber-200',
    red: 'bg-red-500/15 text-red-200'
  };
  return (
    <div className="premium-card rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-black text-white">{value}</p>
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
    draft: ['Draft', 'bg-slate-500/15 text-slate-300', AlertCircle],
    submitted: ['Submitted', 'bg-amber-500/15 text-amber-200', AlertCircle],
    approved: ['Approved', 'bg-emerald-500/15 text-emerald-200', CheckCircle2],
    rejected: ['Rejected', 'bg-red-500/15 text-red-200', XCircle]
  }[goal.status] || ['Draft', 'bg-slate-500/15 text-slate-300', AlertCircle];
  const StatusIcon = status[2];

  return (
    <article className="premium-card rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-black text-white">{goal.title}</h2>
        {goal.locked && <Lock className="shrink-0 text-slate-400" size={18} />}
      </div>
      <p className="mt-2 min-h-12 text-sm font-medium leading-6 text-slate-400">{goal.description || 'No description added.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${status[1]}`}>
          <StatusIcon size={14} /> {status[0]}
        </span>
        <span className="rounded bg-indigo-500/15 px-2 py-1 text-xs font-bold text-indigo-200">{goal.weightage}%</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-slate-500">Thrust area</dt><dd className="font-bold text-slate-200">{goal.thrust_area}</dd></div>
        <div><dt className="text-slate-500">Target</dt><dd className="font-bold text-slate-200">{goal.target_value} {goal.uom}</dd></div>
      </dl>
      {goal.manager_feedback && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm font-medium text-red-200">{goal.manager_feedback}</p>}
    </article>
  );
}

function FocusGoal({ goal }) {
  const progress = goal.status === 'approved' ? 100 : goal.status === 'submitted' ? 68 : goal.status === 'rejected' ? 22 : 38;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-4">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r={radius} stroke="rgba(148,163,184,0.25)" strokeWidth="5" fill="none" />
          <circle cx="22" cy="22" r={radius} stroke="#6366F1" strokeWidth="5" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate font-extrabold text-white">{goal.title}</h3>
            <span className="text-sm font-black text-indigo-200">{progress}%</span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-400">{goal.thrust_area} · {goal.weightage}% weight</p>
        </div>
      </div>
    </article>
  );
}
