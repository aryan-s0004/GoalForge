import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getGoals, createGoal, updateGoal, submitGoals } from '../lib/api';

const THRUST_AREAS = ['Sales & Revenue', 'Customer Success', 'Product Development', 'Operations', 'People & Culture'];
const UOM_OPTIONS = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'timeline', label: 'Timeline' },
];

const STATUS_STYLES = {
  DRAFT: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground',
  SUBMITTED: 'bg-primary/10 text-primary',
  submitted: 'bg-primary/10 text-primary',
  APPROVED: 'bg-success/10 text-success',
  approved: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function EmployeeDashboard() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', thrust_area: '', uom: 'percent', target_value: '', weightage: '' });

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getGoals();
      setGoals(data);
    } catch (err) {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
  const draftGoals = goals.filter((g) => (g.status || '').toUpperCase() === 'DRAFT');
  const canSubmit = draftGoals.length > 0 && totalWeightage === 100 && draftGoals.every((g) => Number(g.weightage) >= 10);

  const resetForm = () => {
    setForm({ title: '', description: '', thrust_area: '', uom: 'percent', target_value: '', weightage: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editingId) {
        await updateGoal(editingId, {
          title: form.title,
          description: form.description,
          thrust_area: form.thrust_area,
          uom: form.uom,
          target_value: Number(form.target_value),
          weightage: Number(form.weightage),
        });
        setSuccess('Goal updated');
      } else {
        await createGoal({
          title: form.title,
          description: form.description,
          thrust_area: form.thrust_area,
          uom: form.uom,
          target_value: Number(form.target_value),
          weightage: Number(form.weightage),
        });
        setSuccess('Goal created');
      }
      resetForm();
      fetchGoals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  const handleSubmit = async () => {
    setError('');
    try {
      await submitGoals();
      setSuccess('Goals submitted for approval!');
      fetchGoals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Submit failed');
    }
  };

  const startEdit = (goal) => {
    setForm({
      title: goal.title,
      description: goal.description || '',
      thrust_area: goal.thrust_area || goal.uomType || '',
      uom: goal.uom || goal.uomType || 'percent',
      target_value: String(goal.target_value ?? goal.target ?? ''),
      weightage: String(goal.weightage || ''),
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  return (
    <Layout>
      <div className="animate-rise">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Goals</h1>
            <p className="text-sm text-muted-foreground mt-1">Q2 2026 — Define and track your quarterly objectives</p>
          </div>
          {draftGoals.length > 0 && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', description: '', thrust_area: '', uom: 'percent', target_value: '', weightage: '' }); }}
              className="gradient-brand-bg text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              + Add Goal
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && <div className="bg-red-50 text-destructive text-sm rounded-lg px-4 py-3 border border-red-200 mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-success text-sm rounded-lg px-4 py-3 border border-green-200 mb-4">{success}</div>}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="panel p-4">
            <div className="text-2xl font-bold">{goals.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Goals</div>
          </div>
          <div className="panel p-4">
            <div className={`text-2xl font-bold ${totalWeightage === 100 ? 'text-success' : totalWeightage > 100 ? 'text-destructive' : 'text-warning'}`}>
              {totalWeightage}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total Weightage</div>
          </div>
          <div className="panel p-4">
            <div className="text-2xl font-bold text-success">{goals.filter((g) => (g.status || '').toUpperCase() === 'APPROVED').length}</div>
            <div className="text-xs text-muted-foreground mt-1">Approved</div>
          </div>
          <div className="panel p-4">
            <div className="text-2xl font-bold text-primary">{goals.filter((g) => (g.status || '').toUpperCase() === 'SUBMITTED').length}</div>
            <div className="text-xs text-muted-foreground mt-1">Pending Review</div>
          </div>
        </div>

        {/* Goal Form */}
        {showForm && (
          <div className="panel p-6 mb-6 animate-rise">
            <h3 className="font-semibold text-lg mb-4">{editingId ? 'Edit Goal' : 'New Goal'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Increase sales by 20%" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="field min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what you'll achieve..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thrust Area</label>
                <select className="field" value={form.thrust_area} onChange={(e) => setForm({ ...form, thrust_area: e.target.value })}>
                  <option value="">Select...</option>
                  {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit of Measure</label>
                <select className="field" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })}>
                  {UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Value</label>
                <input className="field" type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} placeholder="e.g., 20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weightage (%)</label>
                <input className="field" type="number" min="10" max="100" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: e.target.value })} placeholder="10-100" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} className="gradient-brand-bg text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">
                {editingId ? 'Update' : 'Save Goal'}
              </button>
              <button onClick={resetForm} className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg border border-border hover:bg-muted transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="panel p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="panel p-12 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold text-lg mb-1">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first quarterly goal to get started.</p>
            <button onClick={() => setShowForm(true)} className="gradient-brand-bg text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90">
              Create First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const status = (goal.status || 'draft').toUpperCase();
              return (
                <div key={goal.id} className="panel p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{goal.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
                          {status}
                        </span>
                        {goal.locked && <span className="text-xs text-muted-foreground">🔒</span>}
                      </div>
                      {goal.description && <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>}
                      {goal.managerFeedback && (
                        <div className="mt-2 bg-warning/5 border border-warning/20 rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium text-warning">Feedback:</span> {goal.managerFeedback}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm shrink-0">
                      <div className="text-right">
                        <div className="font-semibold">{goal.weightage}%</div>
                        <div className="text-xs text-muted-foreground">weight</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{goal.target ?? goal.target_value}</div>
                        <div className="text-xs text-muted-foreground">{goal.uomType || goal.uom}</div>
                      </div>
                      {status === 'DRAFT' && !goal.locked && (
                        <button onClick={() => startEdit(goal)} className="text-primary hover:underline text-sm font-medium">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Button */}
        {draftGoals.length > 0 && (
          <div className="mt-6 panel p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {canSubmit
                  ? '✅ Ready to submit — all validations passed'
                  : totalWeightage !== 100
                    ? `⚠️ Total weightage is ${totalWeightage}% — must be exactly 100%`
                    : '⚠️ Each goal needs at least 10% weightage'}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gradient-brand-bg text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Submit for Approval
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
