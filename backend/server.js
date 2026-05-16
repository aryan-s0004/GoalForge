import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'goal-forge-secret-key-2026';
const hasSupabase = process.env.USE_SUPABASE === 'true'
  && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabase = hasSupabase
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const store = {
  profiles: [
    { id: 'emp-1', email: 'john.employee@atomberg.com', full_name: 'John Employee', role: 'employee', manager_id: 'mgr-1' },
    { id: 'emp-2', email: 'jane.employee@atomberg.com', full_name: 'Jane Employee', role: 'employee', manager_id: 'mgr-1' },
    { id: 'mgr-1', email: 'mike.manager@atomberg.com', full_name: 'Mike Manager', role: 'manager', manager_id: null },
    { id: 'admin-1', email: 'admin@atomberg.com', full_name: 'GoalForge Admin', role: 'admin', manager_id: null }
  ],
  goals: [
    {
      id: 'goal-1',
      user_id: 'emp-1',
      title: 'Improve partner activation',
      description: 'Increase activated distributor partners in the west region.',
      thrust_area: 'Sales & Revenue',
      uom: 'percent',
      target_value: 18,
      weightage: 35,
      status: 'draft',
      locked: false,
      manager_feedback: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'goal-2',
      user_id: 'emp-1',
      title: 'Reduce ticket aging',
      description: 'Bring down customer support tickets older than seven days.',
      thrust_area: 'Customer Success',
      uom: 'percent',
      target_value: 12,
      weightage: 25,
      status: 'draft',
      locked: false,
      manager_feedback: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'goal-3',
      user_id: 'emp-2',
      title: 'Launch QA automation suite',
      description: 'Automate smoke coverage for core release journeys.',
      thrust_area: 'Product Development',
      uom: 'numeric',
      target_value: 40,
      weightage: 100,
      status: 'submitted',
      locked: false,
      manager_feedback: '',
      created_at: new Date().toISOString()
    }
  ],
  shared_goals: [],
  audit_logs: []
};

const sendError = (res, status, message) => res.status(status).json({ error: message });
const nextId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const publicUser = (user) => ({ id: user.id, email: user.email, role: user.role, name: user.full_name });

const db = {
  async findProfileByEmail(email) {
    if (!hasSupabase) return store.profiles.find((profile) => profile.email === email);
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error) return null;
    return data;
  },
  async findProfileById(id) {
    if (!hasSupabase) return store.profiles.find((profile) => profile.id === id);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },
  async listGoalsForUser(userId) {
    if (!hasSupabase) return store.goals.filter((goal) => goal.user_id === userId);
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at');
    if (error) throw error;
    return data;
  },
  async createGoal(goal) {
    if (!hasSupabase) {
      const saved = { id: nextId('goal'), locked: false, manager_feedback: '', created_at: new Date().toISOString(), ...goal };
      store.goals.push(saved);
      return saved;
    }
    const { data, error } = await supabase.from('goals').insert([goal]).select().single();
    if (error) throw error;
    return data;
  },
  async findGoal(id) {
    if (!hasSupabase) return store.goals.find((goal) => goal.id === id);
    const { data, error } = await supabase.from('goals').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },
  async updateGoal(id, patch) {
    if (!hasSupabase) {
      const index = store.goals.findIndex((goal) => goal.id === id);
      if (index === -1) return null;
      store.goals[index] = { ...store.goals[index], ...patch };
      return store.goals[index];
    }
    const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async updateDraftGoalsForUser(userId, patch) {
    if (!hasSupabase) {
      store.goals = store.goals.map((goal) => (
        goal.user_id === userId && goal.status === 'draft' ? { ...goal, ...patch } : goal
      ));
      return;
    }
    const { error } = await supabase.from('goals').update(patch).eq('user_id', userId).eq('status', 'draft');
    if (error) throw error;
  },
  async listPendingForManager(managerId) {
    if (!hasSupabase) {
      const teamIds = store.profiles.filter((profile) => profile.manager_id === managerId).map((profile) => profile.id);
      return store.goals
        .filter((goal) => teamIds.includes(goal.user_id) && goal.status === 'submitted')
        .map((goal) => ({ ...goal, profiles: store.profiles.find((profile) => profile.id === goal.user_id) }));
    }
    const { data: team, error: teamError } = await supabase.from('profiles').select('id').eq('manager_id', managerId);
    if (teamError) throw teamError;
    const teamIds = team.map((profile) => profile.id);
    if (!teamIds.length) return [];
    const { data, error } = await supabase
      .from('goals')
      .select('*, profiles(email, full_name)')
      .in('user_id', teamIds)
      .eq('status', 'submitted');
    if (error) throw error;
    return data;
  },
  async listProfilesByEmails(emails) {
    if (!hasSupabase) return store.profiles.filter((profile) => emails.includes(profile.email));
    const { data, error } = await supabase.from('profiles').select('*').in('email', emails);
    if (error) throw error;
    return data;
  },
  async listUsers() {
    if (!hasSupabase) return [...store.profiles].sort((a, b) => a.email.localeCompare(b.email));
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) throw error;
    return data;
  },
  async createSharedGoal(goal) {
    if (!hasSupabase) {
      const saved = { id: nextId('shared'), created_at: new Date().toISOString(), ...goal };
      store.shared_goals.push(saved);
      return saved;
    }
    const { data, error } = await supabase.from('shared_goals').insert([goal]).select().single();
    if (error) throw error;
    return data;
  },
  async listAllGoals() {
    if (!hasSupabase) {
      return store.goals.map((goal) => ({ ...goal, profiles: store.profiles.find((profile) => profile.id === goal.user_id) }));
    }
    const { data, error } = await supabase.from('goals').select('*, profiles(email, full_name, role)').order('created_at');
    if (error) throw error;
    return data;
  },
  async createAuditLog(log) {
    if (!hasSupabase) {
      store.audit_logs.unshift({ id: nextId('audit'), created_at: new Date().toISOString(), ...log });
      return;
    }
    const { error } = await supabase.from('audit_logs').insert([log]);
    if (error) throw error;
  },
  async listAuditLogs() {
    if (!hasSupabase) {
      return store.audit_logs.map((log) => ({ ...log, profiles: store.profiles.find((profile) => profile.id === log.changed_by) }));
    }
    const { data, error } = await supabase.from('audit_logs').select('*, profiles(email, full_name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return sendError(res, 401, 'No token');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findProfileById(decoded.userId);
    if (!user) return sendError(res, 401, 'Invalid token');
    req.user = user;
    next();
  } catch {
    sendError(res, 401, 'Invalid token');
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return sendError(res, 403, 'Unauthorized');
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: hasSupabase ? 'supabase' : 'demo' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, 400, 'Email is required');

  const user = await db.findProfileByEmail(email);
  if (!user) return sendError(res, 401, 'User not found');

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: publicUser(user) });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json(req.user);
});

app.get('/api/goals', auth, async (req, res) => {
  try {
    res.json(await db.listGoalsForUser(req.user.id));
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.post('/api/goals', auth, async (req, res) => {
  try {
    const { title, description, thrust_area, uom, target_value, weightage } = req.body;
    const parsedWeightage = Number(weightage);
    if (!title || !thrust_area || !uom || target_value === '') return sendError(res, 400, 'Missing required fields');
    if (parsedWeightage < 10) return sendError(res, 400, 'Minimum weightage is 10%');

    const goals = await db.listGoalsForUser(req.user.id);
    if (goals.length >= 8) return sendError(res, 400, 'Maximum 8 goals allowed');
    if (goals.some((goal) => goal.status !== 'draft')) return sendError(res, 400, 'Cannot add goals after submission');

    const total = goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
    if (total + parsedWeightage > 100) return sendError(res, 400, `Total weightage cannot exceed 100% (current: ${total}%)`);

    const goal = await db.createGoal({
      user_id: req.user.id,
      title,
      description,
      thrust_area,
      uom,
      target_value: Number(target_value),
      weightage: parsedWeightage,
      status: 'draft'
    });
    res.status(201).json(goal);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/api/goals/:id', auth, async (req, res) => {
  try {
    const goal = await db.findGoal(req.params.id);
    if (!goal || goal.user_id !== req.user.id) return sendError(res, 404, 'Goal not found');
    if (goal.locked) return sendError(res, 400, 'Goal locked');
    if (goal.status !== 'draft') return sendError(res, 400, 'Cannot edit submitted goal');

    const patch = { ...req.body };
    if (patch.weightage !== undefined) patch.weightage = Number(patch.weightage);
    if (patch.target_value !== undefined) patch.target_value = Number(patch.target_value);
    res.json(await db.updateGoal(req.params.id, patch));
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.post('/api/goals/submit', auth, async (req, res) => {
  try {
    const goals = (await db.listGoalsForUser(req.user.id)).filter((goal) => goal.status === 'draft');
    if (!goals.length) return sendError(res, 400, 'No draft goals to submit');
    if (goals.length > 8) return sendError(res, 400, 'Maximum 8 goals allowed');

    const total = goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
    if (total !== 100) return sendError(res, 400, `Total weightage must be 100% (current: ${total}%)`);
    if (goals.some((goal) => Number(goal.weightage) < 10)) return sendError(res, 400, 'Each goal needs at least 10% weightage');

    await db.updateDraftGoalsForUser(req.user.id, { status: 'submitted' });
    res.json({ message: 'Goals submitted for approval' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/approvals/pending', auth, async (req, res) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return sendError(res, 403, 'Manager access required');
    if (req.user.role === 'admin') {
      const goals = (await db.listAllGoals()).filter((goal) => goal.status === 'submitted');
      return res.json(goals);
    }
    res.json(await db.listPendingForManager(req.user.id));
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/api/approvals/:goalId/approve', auth, async (req, res) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return sendError(res, 403, 'Not authorized');
    const goal = await db.updateGoal(req.params.goalId, { status: 'approved', locked: true, manager_feedback: '' });
    if (!goal) return sendError(res, 404, 'Goal not found');
    await db.createAuditLog({ goal_id: req.params.goalId, action: 'APPROVE', changed_by: req.user.id, notes: 'Manager approved goal' });
    res.json(goal);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/api/approvals/:goalId/reject', auth, async (req, res) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return sendError(res, 403, 'Not authorized');
    const { feedback } = req.body;
    if (!feedback) return sendError(res, 400, 'Feedback is required');
    const goal = await db.updateGoal(req.params.goalId, { status: 'rejected', locked: false, manager_feedback: feedback });
    if (!goal) return sendError(res, 404, 'Goal not found');
    await db.createAuditLog({ goal_id: req.params.goalId, action: 'REJECT', changed_by: req.user.id, notes: feedback });
    res.json(goal);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/api/approvals/:goalId/edit', auth, async (req, res) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return sendError(res, 403, 'Not authorized');
    const { target_value, weightage } = req.body;
    const goal = await db.updateGoal(req.params.goalId, {
      target_value: Number(target_value),
      weightage: Number(weightage)
    });
    if (!goal) return sendError(res, 404, 'Goal not found');
    await db.createAuditLog({ goal_id: req.params.goalId, action: 'MANAGER_EDIT', changed_by: req.user.id, notes: 'Manager adjusted target or weightage' });
    res.json(goal);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.post('/api/admin/shared-goal', auth, requireRole('admin'), async (req, res) => {
  try {
    const { title, description, thrust_area, uom, target_value, assigned_to_emails } = req.body;
    if (!title || !Array.isArray(assigned_to_emails) || !assigned_to_emails.length) {
      return sendError(res, 400, 'Title and assigned employee emails are required');
    }

    const sharedGoal = await db.createSharedGoal({
      created_by: req.user.id,
      title,
      description,
      thrust_area,
      uom,
      target_value: Number(target_value),
      assigned_to_emails
    });

    const employees = await db.listProfilesByEmails(assigned_to_emails);
    await Promise.all(employees.map((employee) => db.createGoal({
      user_id: employee.id,
      title,
      description,
      thrust_area,
      uom,
      target_value: Number(target_value),
      weightage: 10,
      status: 'draft'
    })));

    await db.createAuditLog({ goal_id: null, action: 'SHARED_GOAL', changed_by: req.user.id, notes: `Assigned ${title}` });
    res.status(201).json({ ...sharedGoal, assigned_count: employees.length });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/admin/goals', auth, requireRole('admin'), async (req, res) => {
  try {
    res.json(await db.listAllGoals());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/api/admin/goals/:id/unlock', auth, requireRole('admin'), async (req, res) => {
  try {
    const goal = await db.updateGoal(req.params.id, { locked: false, status: 'draft' });
    if (!goal) return sendError(res, 404, 'Goal not found');
    await db.createAuditLog({ goal_id: req.params.id, action: 'UNLOCK', changed_by: req.user.id, notes: 'Admin unlocked goal' });
    res.json(goal);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/admin/audit-logs', auth, requireRole('admin'), async (req, res) => {
  try {
    res.json(await db.listAuditLogs());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/admin/users', auth, requireRole('admin'), async (req, res) => {
  try {
    res.json(await db.listUsers());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.listen(PORT, () => {
  console.log(`GoalForge API running on http://localhost:${PORT} (${hasSupabase ? 'Supabase' : 'demo'} mode)`);
});
