import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import {
  getAdminGoals, getAuditLogs, getUsers, createSharedGoal, unlockGoal,
  getEscalations, resolveEscalation, triggerMockEscalation, resetDemoData
} from '../lib/api';

const TABS = ['Overview', 'Goals', 'Audit Log', 'Escalations', 'Shared Goals'];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const STATUS_STYLES = {
  DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  SUBMITTED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};


export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [demoActionLoading, setDemoActionLoading] = useState(false);
  const [sgForm, setSgForm] = useState({ title: '', description: '', target: '', department: 'General', assigned_to_emails: '' });
  const [selectedDiffLog, setSelectedDiffLog] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [g, l, u, e] = await Promise.all([
        getAdminGoals(),
        getAuditLogs(),
        getUsers(),
        getEscalations()
      ]);
      setGoals(g.data || []);
      setLogs(l.data || []);
      setUsers(u.data || []);
      setEscalations(e.data || []);
    } catch (err) {
      setError('Failed to refresh corporate performance ledger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const clearAlerts = () => setTimeout(() => { setSuccess(''); setError(''); }, 4000);

  // Analytics
  const statusCounts = goals.reduce((acc, g) => {
    const s = (g.status || 'DRAFT').toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  
  const deptData = goals.reduce((acc, g) => {
    const dept = g.employee?.department || g.department || 'Other';
    const existing = acc.find((d) => d.department === dept);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ department: dept, count: 1 });
    }
    return acc;
  }, []);

  const totalEmployees = users.filter((u) => (u.role || '').toUpperCase() === 'EMPLOYEE').length;
  const avgGoals = totalEmployees ? (goals.length / totalEmployees).toFixed(1) : 0;
  const approvedPct = goals.length ? Math.round((statusCounts.APPROVED || 0) / goals.length * 100) : 0;

  const handleCreateSharedGoal = async (e) => {
    e.preventDefault();
    setError('');
    const emails = sgForm.assigned_to_emails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!sgForm.title || !emails.length) return setError('Goal title and assigned employee emails are required');
    
    try {
      await createSharedGoal({
        title: sgForm.title.trim(),
        description: sgForm.description.trim(),
        target: Number(sgForm.target) || 0,
        department: sgForm.department.trim(),
        assigned_to_emails: emails
      });
      setSuccess('Shared goal cascaded successfully across assigned profiles!');
      setSgForm({ title: '', description: '', target: '', department: 'General', assigned_to_emails: '' });
      fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cascade shared goal');
    }
  };

  const handleUnlock = async (id) => {
    try {
      await unlockGoal(id);
      setSuccess('Goal successfully unlocked for employee revisions');
      fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlock goal');
    }
  };

  const handleResolveEscalation = async (id) => {
    try {
      await resolveEscalation(id);
      setSuccess('Escalation resolved and marked resolved');
      fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve escalation');
    }
  };

  const triggerResetDemo = async () => {
    setDemoActionLoading(true);
    setError('');
    try {
      await resetDemoData();
      setSuccess('Database successfully reset to seeded deterministic live state!');
      fetchAll();
      clearAlerts();
    } catch (err) {
      setError('Failed to trigger seed reset');
    } finally {
      setDemoActionLoading(false);
    }
  };

  const triggerMockEsc = async () => {
    setDemoActionLoading(true);
    setError('');
    try {
      await triggerMockEscalation();
      setSuccess('HR Escalation auto-triggered successfully for overdue submissions!');
      fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Escalation trigger failed (all setups approved?)');
    } finally {
      setDemoActionLoading(false);
    }
  };

  const renderDiff = (log) => {
    if (!log.oldData && !log.newData) return '—';
    const oldVal = log.oldData || {};
    const newVal = log.newData || {};

    const changes = [];
    if (oldVal.title !== newVal.title && newVal.title !== undefined) changes.push(`Title: "${oldVal.title}" ➔ "${newVal.title}"`);
    if (oldVal.weightage !== newVal.weightage && newVal.weightage !== undefined) changes.push(`Weight: ${oldVal.weightage}% ➔ ${newVal.weightage}%`);
    if (oldVal.target !== newVal.target && newVal.target !== undefined) changes.push(`Target: ${oldVal.target} ➔ ${newVal.target}`);
    if (oldVal.status !== newVal.status && newVal.status !== undefined) changes.push(`Status: ${oldVal.status} ➔ ${newVal.status}`);

    if (changes.length === 0) return 'No structural metric differences.';
    return (
      <div className="flex flex-col gap-1 text-[11px] font-mono">
        {changes.map((c, i) => (
          <span key={i} className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15 w-fit">
            {c}
          </span>
        ))}
      </div>
    );
  };

  const exportCSV = () => {
    const rows = [['Title', 'Employee', 'Status', 'Weightage', 'Target', 'Department']];
    goals.forEach((g) => rows.push([g.title, g.employee?.name || '', g.status, g.weightage, g.target ?? g.target_value, g.employee?.department || '']));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'goalforge-goals-export.csv'; a.click();
    URL.revokeObjectURL(url);
    setSuccess('Performance CSV exported successfully');
    clearAlerts();
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">Corporate Administrator</span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">Enterprise Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Manage global goals, analyze performance distributions, and review color-coded audits.</p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 focus:outline-none"
          >
            📥 Export CSV
          </button>
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 border border-slate-800/60 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition ${tab === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl h-60" />
            ))}
          </div>
        ) : (
          <>
            {/* ─── Overview Tab ─── */}
            {tab === 'Overview' && (
              <div className="space-y-6">
                
                {/* Seed Data Reset & Demo control panel */}
                <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/25 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>Enterprise Live Demonstrator</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Prepare a perfect evaluation environment in one click! Reset the database to deterministic pre-seeded setups, or simulate an HR overdue goal submission escalation.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button
                      onClick={triggerResetDemo}
                      disabled={demoActionLoading}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-extrabold rounded-xl transition focus:outline-none flex items-center gap-1.5 shadow"
                    >
                      🔄 Reset & Seed Live Data
                    </button>
                    <button
                      onClick={triggerMockEsc}
                      disabled={demoActionLoading}
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-extrabold rounded-xl transition focus:outline-none flex items-center gap-1.5 shadow-lg shadow-rose-600/10"
                    >
                      ⚠️ Auto-Trigger Escalation
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl">
                    <div className="text-2xl font-extrabold text-slate-100">{goals.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">Total Goals Logged</div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl">
                    <div className="text-2xl font-extrabold text-emerald-400">{approvedPct}%</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">Approved Rate</div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl">
                    <div className="text-2xl font-extrabold text-indigo-400">{totalEmployees}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">Active Employees</div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl">
                    <div className="text-2xl font-extrabold text-slate-100">{avgGoals}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">Avg Goals/Employee</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Pie Chart */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col">
                    <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">Goal Status breakdown</h3>
                    <div className="flex-1 min-h-[220px] flex items-center justify-center">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={{ stroke: '#334155' }}
                            >
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-xs text-slate-500">Corporate goals distribution empty.</span>
                      )}
                    </div>
                  </div>

                  {/* Department Bar Chart */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col">
                    <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">Goals by Division</h3>
                    <div className="flex-1 min-h-[220px] flex items-center justify-center">
                      {deptData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-xs text-slate-500">Corporate divisions list empty.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Directory List summary */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
                  <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">System Access Directory</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {users.map((u) => (
                      <div key={u.id} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-xs shrink-0">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.role} · {u.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ─── Goals Tab ─── */}
            {tab === 'Goals' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-left">
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Objective Title</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Employee</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Status</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider text-right">Weight</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider text-right">Target</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider text-center">Unlocks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {goals.map((g) => {
                        const status = (g.status || 'DRAFT').toUpperCase();
                        
                        return (
                          <tr key={g.id} className="hover:bg-slate-950/20 transition-colors">
                            <td className="px-5 py-4 font-semibold max-w-xs truncate">{g.title}</td>
                            <td className="px-5 py-4 text-slate-400">{g.employee?.name || 'Shared Core'}</td>
                            <td className="px-5 py-4">
                              <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase ${STATUS_STYLES[status] || STATUS_STYLES.DRAFT}`}>
                                {status}
                              </span>
                              {g.locked && <span className="ml-1 text-[10px]">🔒</span>}
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-indigo-400">{g.weightage}%</td>
                            <td className="px-5 py-4 text-right font-mono font-bold">{g.target ?? g.target_value}</td>
                            <td className="px-5 py-4 text-center">
                              {g.locked ? (
                                <button
                                  onClick={() => handleUnlock(g.id)}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold focus:outline-none"
                                >
                                  Unlock
                                </button>
                              ) : (
                                <span className="text-slate-600 font-mono">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {goals.length === 0 && (
                  <div className="p-12 text-center text-xs text-slate-500">No corporate goals in database ledger.</div>
                )}
              </div>
            )}

            {/* ─── Audit Log Tab with colorized diffs! ─── */}
            {tab === 'Audit Log' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-left">
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Action Type</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Performed By</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Operational Notes</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Corporate Trace Diff</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                              {log.action?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 whitespace-nowrap">{log.performer?.name || log.performedBy}</td>
                          <td className="px-5 py-4 max-w-xs truncate">{log.notes || '—'}</td>
                          <td className="px-5 py-4">{renderDiff(log)}</td>
                          <td className="px-5 py-4 text-slate-500 font-mono whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logs.length === 0 && (
                  <div className="p-12 text-center text-xs text-slate-500">No organizational audit activities logged.</div>
                )}
              </div>
            )}

            {/* ─── Escalations Tab ─── */}
            {tab === 'Escalations' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-left">
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Employee</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Manager</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider">Escalation Trigger Type</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider text-center">Status</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-wider text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {escalations.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="px-5 py-4 font-semibold">{e.employee?.name || 'Arjun Mehta'}</td>
                          <td className="px-5 py-4 text-slate-400">{e.manager?.name || 'Kavita Nair'}</td>
                          <td className="px-5 py-4 font-mono whitespace-nowrap">
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                              ⚠️ {e.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${e.resolved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'}`}>
                              {e.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {!e.resolved ? (
                              <button
                                onClick={() => handleResolveEscalation(e.id)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition focus:outline-none"
                              >
                                Mark Resolved
                              </button>
                            ) : (
                              <span className="text-slate-600 font-mono">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {escalations.length === 0 && (
                  <div className="p-12 text-center text-xs text-slate-500">No active goal setting escalations in system logs.</div>
                )}
              </div>
            )}

            {/* ─── Shared Goals Tab ─── */}
            {tab === 'Shared Goals' && (
              <div className="space-y-6 animate-rise">
                <form onSubmit={handleCreateSharedGoal} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Cascade Corporate Objective</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Shared Goal Title</label>
                      <input
                        required
                        value={sgForm.title}
                        onChange={(e) => setSgForm({ ...sgForm, title: e.target.value })}
                        placeholder="e.g. Reduce corporate cloud cost margins by 15%..."
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Roadmap Context</label>
                      <textarea
                        value={sgForm.description}
                        onChange={(e) => setSgForm({ ...sgForm, description: e.target.value })}
                        placeholder="Provide details for multi-team alignment..."
                        rows={2}
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Target Parameter</label>
                      <input
                        type="number"
                        required
                        value={sgForm.target}
                        onChange={(e) => setSgForm({ ...sgForm, target: e.target.value })}
                        placeholder="e.g. 15"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Department Sync Scope</label>
                      <input
                        required
                        value={sgForm.department}
                        onChange={(e) => setSgForm({ ...sgForm, department: e.target.value })}
                        placeholder="e.g. Engineering"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Target Accounts (Comma-separated employee emails)</label>
                      <textarea
                        required
                        value={sgForm.assigned_to_emails}
                        onChange={(e) => setSgForm({ ...sgForm, assigned_to_emails: e.target.value })}
                        placeholder="e.g. arjun@goalforge.com, priya@goalforge.com"
                        rows={2}
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs transition font-mono resize-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition focus:outline-none"
                  >
                    🚀 Cascade & Sync Goal Set
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
