import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getGoals, createGoal, updateGoal, submitGoals, getCheckinsForGoal } from '../lib/api';
import CheckinModal from '../components/CheckinModal';

const THRUST_AREAS = ['Sales & Revenue', 'Customer Success', 'Product Development', 'Operations', 'People & Culture'];
const UOM_OPTIONS = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'numeric', label: 'Numeric (Absolute)' },
  { value: 'tat', label: 'Speed / Turnaround Time (TAT)' },
  { value: 'zero-occurrence', label: 'Zero-Occurrence / Incident Metric' },
];

const STATUS_STYLES = {
  DRAFT: 'bg-slate-800 text-slate-400 border-slate-700',
  SUBMITTED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function EmployeeDashboard() {
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalCheckins, setGoalCheckins] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', thrust_area: 'General', uom: 'percent', target_value: '', weightage: '' });

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getGoals();
      setGoals(data || []);
      
      // Proactively fetch check-ins for approved goals to display accomplishments history!
      const checkinMap = {};
      await Promise.all(
        (data || []).map(async (g) => {
          if (g.status === 'APPROVED') {
            try {
              const res = await getCheckinsForGoal(g.id);
              checkinMap[g.id] = res.data || [];
            } catch (err) {
              console.error('Failed to load checkins for goal', g.id, err);
            }
          }
        })
      );
      setGoalCheckins(checkinMap);
    } catch (err) {
      setError('Failed to load goals performance matrix');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
  const draftGoals = goals.filter((g) => g.status === 'DRAFT' || g.status === 'REJECTED');
  
  // Validation constraints enforcement in frontend
  const isGoalCountValid = goals.length <= 8;
  const isWeightageValid = totalWeightage === 100;
  const eachGoalMinTen = goals.every(g => Number(g.weightage) >= 10);
  
  const canSubmit = draftGoals.length > 0 && isGoalCountValid && isWeightageValid && eachGoalMinTen;

  const resetForm = () => {
    setForm({ title: '', description: '', thrust_area: 'General', uom: 'percent', target_value: '', weightage: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    const parsedTarget = Number(form.target_value);
    const parsedWeight = Number(form.weightage);

    if (!form.title.trim()) return setError('Goal title is required');
    if (!form.thrust_area) return setError('Thrust area is required');
    if (isNaN(parsedTarget) || parsedTarget <= 0) return setError('Target must be a positive number');
    if (isNaN(parsedWeight) || parsedWeight < 10 || parsedWeight > 100) {
      return setError('Weightage must be between 10% and 100%');
    }

    try {
      if (editingId) {
        await updateGoal(editingId, {
          title: form.title.trim(),
          description: form.description.trim(),
          thrust_area: form.thrust_area,
          uom: form.uom,
          target_value: parsedTarget,
          weightage: parsedWeight,
        });
        setSuccess('Goal updated successfully');
      } else {
        if (goals.length >= 8) return setError('Maximum limit of 8 goals reached');
        await createGoal({
          title: form.title.trim(),
          description: form.description.trim(),
          thrust_area: form.thrust_area,
          uom: form.uom,
          target_value: parsedTarget,
          weightage: parsedWeight,
        });
        setSuccess('Goal added in draft');
      }
      resetForm();
      fetchGoals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save goal parameters');
    }
  };

  const handleSubmit = async () => {
    setError('');
    try {
      await submitGoals();
      setSuccess('Your Q2 goals have been submitted for supervisor approval!');
      fetchGoals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Goal submission rejected by business logic rules');
    }
  };

  const startEdit = (goal) => {
    setForm({
      title: goal.title,
      description: goal.description || '',
      thrust_area: goal.thrustArea || goal.thrust_area || 'General',
      uom: goal.uomType || goal.uom || 'percent',
      target_value: String(goal.target ?? goal.target_value ?? ''),
      weightage: String(goal.weightage || ''),
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Banner Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">Employee Workspace</span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">Target Setting & Review</h1>
            <p className="text-xs text-slate-400 mt-1">Review organizational alignment, submit targets, and check-in weekly progress.</p>
          </div>
          <div className="flex items-center gap-2">
            {!goals.some(g => g.status === 'SUBMITTED') && goals.length < 8 && (
              <button
                onClick={() => { setShowForm(true); setEditingId(null); }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 transition"
              >
                + Add Custom Goal
              </button>
            )}
          </div>
        </div>

        {/* Messaging Panels */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-semibold">
            {success}
          </div>
        )}

        {/* Core Constraints Validation Ruleset Box */}
        {draftGoals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-950 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className={`text-lg ${isGoalCountValid ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                {isGoalCountValid ? '✓' : '⚠️'}
              </span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Max Count Rule</span>
                <span className="text-xs font-bold text-slate-200">{goals.length} of 8 Goals Defined</span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-4">
              <span className={`text-lg ${isWeightageValid ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                {isWeightageValid ? '✓' : '⚠️'}
              </span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Weight Sum Target</span>
                <span className="text-xs font-bold text-slate-200">{totalWeightage}% of 100% Target</span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-4">
              <span className={`text-lg ${eachGoalMinTen ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                {eachGoalMinTen ? '✓' : '⚠️'}
              </span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Min Weight Limit</span>
                <span className="text-xs font-bold text-slate-200">
                  {eachGoalMinTen ? 'All goals >= 10%' : 'Under 10% weight detected!'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Goal Form Expansion */}
        {showForm && (
          <form onSubmit={handleSave} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 animate-rise">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
              {editingId ? 'Modify Goal Specifications' : 'Draft New OKR Goal'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Goal Objective Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Expand premium service subscriptions..."
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Context & Key Results (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide quantitative roadmap detail..."
                  rows={2}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Thrust Area</label>
                <select
                  value={form.thrust_area}
                  onChange={(e) => setForm({ ...form, thrust_area: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-xs transition"
                >
                  <option value="General">General OKR</option>
                  {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Unit of Measure (UoM Formula)</label>
                <select
                  value={form.uom}
                  onChange={(e) => setForm({ ...form, uom: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2.5 text-xs transition"
                >
                  {UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Target Value</label>
                <input
                  type="number"
                  required
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                  placeholder="e.g. 100"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Goal Weightage (%)</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="100"
                  value={form.weightage}
                  onChange={(e) => setForm({ ...form, weightage: e.target.value })}
                  placeholder="Minimum 10%"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                {editingId ? 'Modify Specifications' : 'Add to Drafts'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-400 hover:text-white font-bold text-xs transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Goals Main Performance List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Cycle Performance Matrix</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 bg-slate-900 border border-slate-800/80 rounded-3xl animate-pulse space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
              <span className="text-3xl block">🎯</span>
              <h3 className="font-bold text-slate-200 mt-2">Workspace empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Create and submit your first performance goals setup to activate manager tracking.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Draft First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((g) => {
                const status = (g.status || 'draft').toUpperCase();
                const checkins = goalCheckins[g.id] || [];
                const latestCheckin = checkins[0]; // ordered by date desc in back

                return (
                  <div key={g.id} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-slate-700/60 transition duration-150 space-y-4">
                    
                    {/* Goal Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-tight">
                            {g.title}
                          </h3>
                          <span className={`text-[9px] font-extrabold tracking-wider border px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[status] || STATUS_STYLES.DRAFT}`}>
                            {status}
                          </span>
                          {g.locked && (
                            <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono flex items-center gap-1">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{g.description || 'No additional specification provided.'}</p>
                      </div>

                      {/* Weight/Target details */}
                      <div className="flex items-center gap-5 text-right shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono">Weight</span>
                          <span className="font-extrabold text-indigo-400 text-sm">{g.weightage}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono">Target</span>
                          <span className="font-extrabold text-slate-200 text-sm">
                            {g.target ?? g.target_value} <span className="text-[10px] text-slate-400 font-medium uppercase">{g.uomType || g.uom}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress tracking indicator if APPROVED */}
                    {status === 'APPROVED' && (
                      <div className="pt-3 border-t border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 uppercase tracking-widest font-mono">Live Goal Completion</span>
                            <span className="font-bold text-indigo-400 font-mono">{g.progressScore || 0}% Complete</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
                              style={{ width: `${Math.min(g.progressScore || 0, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedGoal(g)}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-lg shadow-indigo-600/5 focus:outline-none"
                          >
                            📈 Check-in
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rejection / Manager Adjustment Comments */}
                    {g.managerFeedback && (
                      <div className="p-3 bg-rose-950/20 border border-rose-500/10 rounded-xl text-xs text-rose-400 flex items-start gap-2">
                        <span className="text-rose-500 font-bold">Feedback:</span>
                        <span className="text-slate-300 font-medium leading-relaxed">{g.managerFeedback}</span>
                      </div>
                    )}

                    {/* Check-in History Logs */}
                    {checkins.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/50 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Historical Check-in Ledger</div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 divide-y divide-slate-800/30">
                          {checkins.map((chk) => (
                            <div key={chk.id} className="pt-2 flex items-start justify-between gap-4 text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-200">Achievement Value: {chk.achievementValue}</span>
                                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20 font-mono">
                                    Score: {chk.calculatedScore}%
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed italic">"{chk.comments || 'No log details.'}"</p>
                                {chk.managerComments && (
                                  <p className="text-[11px] text-emerald-400 font-medium pl-3 border-l-2 border-emerald-500/30 mt-1">
                                    Supervisor: "{chk.managerComments}"
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                {new Date(chk.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Draft Action Handles */}
                    {status === 'DRAFT' && (
                      <div className="pt-3 border-t border-slate-800/40 flex justify-end gap-2.5">
                        <button
                          onClick={() => startEdit(g)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition focus:outline-none"
                        >
                          Modify Setup
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Submission Bar */}
        {draftGoals.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Submit Setup for Supervisor Endorsement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {canSubmit
                  ? 'All core weightage & count validation constraints are successfully matching. Ready to submit!'
                  : totalWeightage !== 100
                    ? `Currently total weight is ${totalWeightage}% — must equal exactly 100% before submission.`
                    : 'Each active goal requires a minimum weightage parameter of 10%.'}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 transition focus:outline-none"
            >
              Submit OKR Draft
            </button>
          </div>
        )}

      </div>

      {/* Embedded Active Check-in Modal Overlay */}
      {selectedGoal && (
        <CheckinModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onSuccess={() => {
            setSelectedGoal(null);
            setSuccess('Weekly performance progress recorded in ledger.');
            fetchGoals();
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}
    </Layout>
  );
}
