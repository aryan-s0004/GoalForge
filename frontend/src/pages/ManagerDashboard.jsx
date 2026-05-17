import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getPendingApprovals, approveGoal, rejectGoal, editGoalBeforeApprove, getAdminGoals, addCheckinComment, getCheckinsForGoal } from '../lib/api';

export default function ManagerDashboard() {
  const [goals, setGoals] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]); // Approved goals to view check-ins for
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feedbackId, setFeedbackId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPatch, setEditPatch] = useState({});
  const [coSignComment, setCoSignComment] = useState({});

  const fetchPendingAndActive = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load pending goal approval sets
      const pendingRes = await getPendingApprovals();
      setGoals(pendingRes.data || []);

      // Load all goals in the system to extract manager's active team approved goals
      const allGoalsRes = await getAdminGoals();
      const approved = (allGoalsRes.data || []).filter(g => g.status === 'APPROVED');
      setActiveGoals(approved);

      // Fetch all check-ins for approved goals to co-sign
      const checkinList = [];
      await Promise.all(
        approved.map(async (g) => {
          try {
            const res = await getCheckinsForGoal(g.id);
            if (res.data && res.data.length > 0) {
              res.data.forEach(c => {
                checkinList.push({ ...c, goalTitle: g.title, employeeName: g.employee?.name || 'Priya' });
              });
            }
          } catch (err) {
            console.error('Failed to load checkins for active goal', g.id);
          }
        })
      );
      // Sort check-ins by creation date (newest first)
      checkinList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCheckins(checkinList);

    } catch (err) {
      setError('Failed to refresh performance approval workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingAndActive();
  }, [fetchPendingAndActive]);

  const clearAlerts = () => setTimeout(() => { setSuccess(''); setError(''); }, 4000);

  const handleApprove = async (id) => {
    try {
      await approveGoal(id);
      setSuccess('Goal setup successfully approved and locked');
      fetchPendingAndActive();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Goal approval failed');
      clearAlerts();
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return setError('Feedback justification comment is required for rejection');
    try {
      await rejectGoal(feedbackId, feedback.trim());
      setSuccess('Goal returned to employee with revision comments');
      setFeedbackId(null);
      setFeedback('');
      fetchPendingAndActive();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Goal rejection failed');
      clearAlerts();
    }
  };

  const handleEdit = async () => {
    const parsedTarget = Number(editPatch.target_value);
    const parsedWeight = Number(editPatch.weightage);

    if (isNaN(parsedTarget) || parsedTarget <= 0) return setError('Target must be a positive number');
    if (isNaN(parsedWeight) || parsedWeight < 10 || parsedWeight > 100) return setError('Weightage must be between 10% and 100%');

    try {
      await editGoalBeforeApprove(editingId, {
        target_value: parsedTarget,
        weightage: parsedWeight,
      });
      setSuccess('Goal parameters adjusted successfully');
      setEditingId(null);
      setEditPatch({});
      fetchPendingAndActive();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust goal parameters');
      clearAlerts();
    }
  };

  const handleCoSign = async (checkinId) => {
    const comment = coSignComment[checkinId];
    if (!comment || !comment.trim()) return setError('Co-sign feedback is required');

    try {
      await addCheckinComment(checkinId, comment.trim());
      setSuccess('Achievement co-signed successfully');
      setCoSignComment(prev => ({ ...prev, [checkinId]: '' }));
      fetchPendingAndActive();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record co-sign feedback');
      clearAlerts();
    }
  };

  const grouped = goals.reduce((acc, goal) => {
    const name = goal.employee?.name || 'Arjun Mehta';
    if (!acc[name]) acc[name] = [];
    acc[name].push(goal);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">Supervisor Hub</span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">Review & Endorse Queue</h1>
            <p className="text-xs text-slate-400 mt-1">Review pending goal setups, override targets directly, and co-sign actual accomplishments.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">{goals.length} setups pending</span>
          </div>
        </div>

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

        {/* Tabbed View / Side by side lists */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Setups Approvals Queue */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Goal Setup Reviews</h2>

            {loading ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
              </div>
            ) : goals.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <span className="text-3xl block">🎉</span>
                <h3 className="font-bold text-slate-200 mt-2">Setups Queue Empty</h3>
                <p className="text-xs text-slate-500 mt-1">All employee goal setup proposals are currently processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([name, employeeGoals]) => {
                  const weightTotal = employeeGoals.reduce((s, g) => s + Number(g.weightage || 0), 0);
                  
                  return (
                    <div key={name} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                      {/* Employee header bar */}
                      <div className="bg-slate-950/40 px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{name}</div>
                            <div className="text-[10px] text-slate-500">Proposal Set: {employeeGoals.length} goals</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${weightTotal === 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          Sum: {weightTotal}% Weight
                        </span>
                      </div>

                      {/* Goal rows */}
                      <div className="divide-y divide-slate-800/40">
                        {employeeGoals.map((g) => (
                          <div key={g.id} className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-slate-200 text-xs sm:text-sm">{g.title}</h4>
                                {g.description && <p className="text-[11px] text-slate-400 mt-1">{g.description}</p>}
                                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-mono">
                                  <span>Target: <strong className="text-slate-300">{g.target ?? g.target_value}</strong></span>
                                  <span>UOM: <strong className="text-slate-300 uppercase">{g.uomType || g.uom}</strong></span>
                                  <span>Weightage: <strong className="text-indigo-400">{g.weightage}%</strong></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => { setEditingId(g.id); setEditPatch({ target_value: g.target ?? g.target_value, weightage: g.weightage }); }}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] transition focus:outline-none"
                                >
                                  Adjust
                                </button>
                                <button
                                  onClick={() => setFeedbackId(g.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] transition focus:outline-none"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApprove(g.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition focus:outline-none"
                                >
                                  Endorse
                                </button>
                              </div>
                            </div>

                            {/* Inline adjustment form override */}
                            {editingId === g.id && (
                              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 animate-rise">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-400">Override Target</label>
                                    <input
                                      type="number"
                                      value={editPatch.target_value || ''}
                                      onChange={(e) => setEditPatch({ ...editPatch, target_value: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-400">Override Weight (%)</label>
                                    <input
                                      type="number"
                                      value={editPatch.weightage || ''}
                                      onChange={(e) => setEditPatch({ ...editPatch, weightage: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleEdit}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition"
                                  >
                                    Save Parameters
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 text-slate-500 hover:text-slate-300 font-bold text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Rejection comment form */}
                            {feedbackId === g.id && (
                              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 animate-rise">
                                <label className="text-[10px] font-semibold text-slate-400 block">Revision Guidance Comments</label>
                                <textarea
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Explain the required metric sync adjustments..."
                                  rows={2}
                                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleReject}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg transition"
                                  >
                                    Reject Set
                                  </button>
                                  <button
                                    onClick={() => { setFeedbackId(null); setFeedback(''); }}
                                    className="px-3 py-1 text-slate-500 hover:text-slate-300 font-bold text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Check-ins & Co-signing Action Log */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Team Progress Ledger (Co-sign Feed)</h2>

            {checkins.length === 0 ? (
              <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500">
                <span className="text-2xl block opacity-50">⚡</span>
                <p className="text-xs mt-2 font-semibold">No recent check-ins logged by approved team members.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checkins.map((c) => (
                  <div key={c.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                    
                    {/* Checkin Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase block tracking-wider">
                          {c.employeeName} Check-in
                        </span>
                        <h4 className="font-bold text-slate-200 text-xs mt-0.5 leading-tight">{c.goalTitle}</h4>
                      </div>
                      <span className="text-[9px] bg-slate-950 border border-slate-800/80 px-2 py-0.5 rounded font-mono text-slate-400 shrink-0">
                        Score: {c.calculatedScore}%
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-xl space-y-1">
                      <div className="text-[10px] text-slate-500">
                        Reported Value: <strong className="text-slate-300 font-mono">{c.achievementValue}</strong>
                      </div>
                      <p className="text-xs italic text-slate-400">"{c.comments || 'No comment provided.'}"</p>
                    </div>

                    {/* Co-sign form or display */}
                    {c.managerComments ? (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl text-xs text-emerald-400 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">Co-signed:</span>
                        <span className="text-slate-300 leading-relaxed font-medium">"{c.managerComments}"</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={coSignComment[c.id] || ''}
                          onChange={(e) => setCoSignComment({ ...coSignComment, [c.id]: e.target.value })}
                          placeholder="Provide performance feedback or click Co-sign..."
                          className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs transition"
                        />
                        <button
                          onClick={() => handleCoSign(c.id)}
                          className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition focus:outline-none"
                        >
                          ✍️ Sign-off & Co-sign Progress
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
