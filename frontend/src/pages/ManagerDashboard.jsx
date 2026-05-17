import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getPendingApprovals, approveGoal, rejectGoal, editGoalBeforeApprove } from '../lib/api';

export default function ManagerDashboard() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feedbackId, setFeedbackId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPatch, setEditPatch] = useState({});

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getPendingApprovals();
      setGoals(data);
    } catch (err) {
      setError('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const clearAlerts = () => setTimeout(() => { setSuccess(''); setError(''); }, 4000);

  const handleApprove = async (id) => {
    try {
      await approveGoal(id);
      setSuccess('Goal approved and locked');
      fetchPending();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.error || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return setError('Feedback is required for rejection');
    try {
      await rejectGoal(feedbackId, feedback);
      setSuccess('Goal rejected with feedback');
      setFeedbackId(null);
      setFeedback('');
      fetchPending();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.error || 'Rejection failed');
    }
  };

  const handleEdit = async () => {
    try {
      await editGoalBeforeApprove(editingId, editPatch);
      setSuccess('Goal updated');
      setEditingId(null);
      setEditPatch({});
      fetchPending();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.error || 'Edit failed');
    }
  };

  // Group goals by employee
  const grouped = goals.reduce((acc, goal) => {
    const name = goal.employee?.name || goal.profiles?.full_name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(goal);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="animate-rise">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Approval Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">Review and approve your team's submitted goals</p>
          </div>
          <div className="panel px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-sm font-medium">{goals.length} pending</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-destructive text-sm rounded-lg px-4 py-3 border border-red-200 mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-success text-sm rounded-lg px-4 py-3 border border-green-200 mb-4">{success}</div>}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="panel p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="panel p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-semibold text-lg mb-1">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No goals pending your approval.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([name, employeeGoals]) => (
              <div key={name} className="panel overflow-hidden">
                <div className="bg-muted/50 border-b border-border px-5 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{name}</div>
                    <div className="text-xs text-muted-foreground">
                      {employeeGoals.length} goal{employeeGoals.length > 1 ? 's' : ''} — Total: {employeeGoals.reduce((s, g) => s + Number(g.weightage || 0), 0)}%
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {employeeGoals.map((goal) => (
                    <div key={goal.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{goal.title}</h4>
                          {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Target: <strong className="text-foreground">{goal.target ?? goal.target_value}</strong></span>
                            <span>UOM: <strong className="text-foreground">{goal.uomType || goal.uom}</strong></span>
                            <span>Weight: <strong className="text-foreground">{goal.weightage}%</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { setEditingId(goal.id); setEditPatch({ target_value: goal.target ?? goal.target_value, weightage: goal.weightage }); }}
                            className="text-xs font-medium px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setFeedbackId(goal.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-red-50 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(goal.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-md gradient-brand-bg text-white hover:opacity-90 transition-opacity"
                          >
                            Approve
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit */}
                      {editingId === goal.id && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border animate-rise">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium mb-1">Target Value</label>
                              <input className="field" type="number" value={editPatch.target_value || ''} onChange={(e) => setEditPatch({ ...editPatch, target_value: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Weightage (%)</label>
                              <input className="field" type="number" min="10" max="100" value={editPatch.weightage || ''} onChange={(e) => setEditPatch({ ...editPatch, weightage: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={handleEdit} className="text-xs font-semibold gradient-brand-bg text-white px-4 py-1.5 rounded-md hover:opacity-90">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Reject Feedback */}
                      {feedbackId === goal.id && (
                        <div className="mt-4 p-4 bg-red-50/50 rounded-lg border border-red-200 animate-rise">
                          <label className="block text-xs font-medium mb-1">Rejection Feedback</label>
                          <textarea className="field min-h-[60px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Explain why this goal needs revision..." />
                          <div className="flex gap-2 mt-3">
                            <button onClick={handleReject} className="text-xs font-semibold bg-destructive text-white px-4 py-1.5 rounded-md hover:opacity-90">Confirm Reject</button>
                            <button onClick={() => { setFeedbackId(null); setFeedback(''); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
