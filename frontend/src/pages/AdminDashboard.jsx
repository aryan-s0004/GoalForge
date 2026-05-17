import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import { getAdminGoals, getAuditLogs, getUsers, createSharedGoal, unlockGoal } from '../lib/api';

const TABS = ['Overview', 'Goals', 'Audit Log', 'Shared Goals'];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sgForm, setSgForm] = useState({ title: '', description: '', target: '', department: '', assigned_to_emails: '' });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [g, l, u] = await Promise.all([getAdminGoals(), getAuditLogs(), getUsers()]);
      setGoals(g.data);
      setLogs(l.data);
      setUsers(u.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const clearAlerts = () => setTimeout(() => { setSuccess(''); setError(''); }, 4000);

  // Analytics
  const statusCounts = goals.reduce((acc, g) => {
    const s = (g.status || 'DRAFT').toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const deptData = goals.reduce((acc, g) => {
    const dept = g.employee?.department || 'Other';
    const existing = acc.find((d) => d.department === dept);
    if (existing) { existing.count += 1; } else { acc.push({ department: dept, count: 1 }); }
    return acc;
  }, []);

  const totalEmployees = users.filter((u) => (u.role || '').toUpperCase() === 'EMPLOYEE').length;
  const avgGoals = totalEmployees ? (goals.length / totalEmployees).toFixed(1) : 0;
  const approvedPct = goals.length ? Math.round((statusCounts.APPROVED || 0) / goals.length * 100) : 0;

  const handleCreateSharedGoal = async () => {
    setError('');
    const emails = sgForm.assigned_to_emails.split(',').map((e) => e.trim()).filter(Boolean);
    if (!sgForm.title || !emails.length) return setError('Title and at least one email are required');
    try {
      await createSharedGoal({ ...sgForm, target: Number(sgForm.target) || 0, assigned_to_emails: emails });
      setSuccess('Shared goal created and assigned!');
      setSgForm({ title: '', description: '', target: '', department: '', assigned_to_emails: '' });
      fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create shared goal');
    }
  };

  const handleUnlock = async (id) => {
    try {
      await unlockGoal(id);
      setSuccess('Goal unlocked');
      fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err.response?.data?.error || 'Unlock failed');
    }
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
    setSuccess('CSV exported');
    clearAlerts();
  };

  return (
    <Layout>
      <div className="animate-rise">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Organization-wide goal management and analytics</p>
          </div>
          <button onClick={exportCSV} className="text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2">
            📥 Export CSV
          </button>
        </div>

        {error && <div className="bg-red-50 text-destructive text-sm rounded-lg px-4 py-3 border border-red-200 mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-success text-sm rounded-lg px-4 py-3 border border-green-200 mb-4">{success}</div>}

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-sm font-medium px-4 py-2 rounded-md transition-all ${tab === t ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="panel p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ─── Overview Tab ─── */}
            {tab === 'Overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="panel p-4"><div className="text-2xl font-bold">{goals.length}</div><div className="text-xs text-muted-foreground mt-1">Total Goals</div></div>
                  <div className="panel p-4"><div className="text-2xl font-bold text-success">{approvedPct}%</div><div className="text-xs text-muted-foreground mt-1">Approved</div></div>
                  <div className="panel p-4"><div className="text-2xl font-bold text-primary">{totalEmployees}</div><div className="text-xs text-muted-foreground mt-1">Employees</div></div>
                  <div className="panel p-4"><div className="text-2xl font-bold text-warning">{avgGoals}</div><div className="text-xs text-muted-foreground mt-1">Avg Goals/Employee</div></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <div className="panel p-6">
                    <h3 className="font-semibold mb-4">Goal Status Distribution</h3>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground">No data</p>}
                  </div>

                  {/* Department Breakdown */}
                  <div className="panel p-6">
                    <h3 className="font-semibold mb-4">Goals by Department</h3>
                    {deptData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={deptData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground">No data</p>}
                  </div>
                </div>

                {/* Recent Audit */}
                <div className="panel p-6">
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">{log.performer?.name || log.performedBy}</span>
                          <span className="text-muted-foreground"> — {log.action?.replace(/_/g, ' ').toLowerCase()}</span>
                          {log.notes && <span className="text-muted-foreground"> · {log.notes}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-sm text-muted-foreground">No activity yet</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Goals Tab ─── */}
            {tab === 'Goals' && (
              <div className="panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-5 py-3 font-semibold">Title</th>
                        <th className="text-left px-5 py-3 font-semibold">Employee</th>
                        <th className="text-left px-5 py-3 font-semibold">Status</th>
                        <th className="text-right px-5 py-3 font-semibold">Weight</th>
                        <th className="text-right px-5 py-3 font-semibold">Target</th>
                        <th className="text-center px-5 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {goals.map((g) => {
                        const status = (g.status || 'DRAFT').toUpperCase();
                        const statusClass = status === 'APPROVED' ? 'bg-success/10 text-success' : status === 'SUBMITTED' ? 'bg-primary/10 text-primary' : status === 'REJECTED' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground';
                        return (
                          <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3 font-medium max-w-xs truncate">{g.title}</td>
                            <td className="px-5 py-3 text-muted-foreground">{g.employee?.name || '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusClass}`}>{status}</span>
                              {g.locked && <span className="ml-1 text-xs">🔒</span>}
                            </td>
                            <td className="px-5 py-3 text-right">{g.weightage}%</td>
                            <td className="px-5 py-3 text-right">{g.target ?? g.target_value}</td>
                            <td className="px-5 py-3 text-center">
                              {g.locked && (
                                <button onClick={() => handleUnlock(g.id)} className="text-xs font-medium text-primary hover:underline">
                                  Unlock
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {goals.length === 0 && (
                  <div className="p-12 text-center text-sm text-muted-foreground">No goals in the system</div>
                )}
              </div>
            )}

            {/* ─── Audit Log Tab ─── */}
            {tab === 'Audit Log' && (
              <div className="panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-5 py-3 font-semibold">Action</th>
                        <th className="text-left px-5 py-3 font-semibold">Performed By</th>
                        <th className="text-left px-5 py-3 font-semibold">Notes</th>
                        <th className="text-left px-5 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                              {log.action?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{log.performer?.name || log.performedBy}</td>
                          <td className="px-5 py-3 text-muted-foreground max-w-xs truncate">{log.notes || '—'}</td>
                          <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logs.length === 0 && (
                  <div className="p-12 text-center text-sm text-muted-foreground">No audit logs yet</div>
                )}
              </div>
            )}

            {/* ─── Shared Goals Tab ─── */}
            {tab === 'Shared Goals' && (
              <div className="space-y-6">
                <div className="panel p-6">
                  <h3 className="font-semibold text-lg mb-4">Create Shared Goal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input className="field" value={sgForm.title} onChange={(e) => setSgForm({ ...sgForm, title: e.target.value })} placeholder="e.g., Achieve 99.9% platform uptime" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea className="field min-h-[60px]" value={sgForm.description} onChange={(e) => setSgForm({ ...sgForm, description: e.target.value })} placeholder="Describe the shared objective..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Target</label>
                      <input className="field" type="number" value={sgForm.target} onChange={(e) => setSgForm({ ...sgForm, target: e.target.value })} placeholder="e.g., 99.9" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <input className="field" value={sgForm.department} onChange={(e) => setSgForm({ ...sgForm, department: e.target.value })} placeholder="e.g., Engineering" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Assign To (comma-separated emails)</label>
                      <textarea className="field min-h-[60px]" value={sgForm.assigned_to_emails} onChange={(e) => setSgForm({ ...sgForm, assigned_to_emails: e.target.value })} placeholder="employee@goalforge.com, priya.sharma@goalforge.com" />
                    </div>
                  </div>
                  <button onClick={handleCreateSharedGoal} className="mt-4 gradient-brand-bg text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                    Create & Assign
                  </button>
                </div>

                {/* Employee Directory */}
                <div className="panel p-6">
                  <h3 className="font-semibold mb-4">Employee Directory</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {users.filter((u) => (u.role || '').toUpperCase() === 'EMPLOYEE').map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">{u.department}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
