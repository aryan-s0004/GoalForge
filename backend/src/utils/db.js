import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const hasSupabase = process.env.USE_SUPABASE === 'true'
  && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

export const supabase = hasSupabase
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

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

const nextId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const db = {
  async findProfileByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!hasSupabase) return store.profiles.find((profile) => profile.email === normalizedEmail);
    const { data, error } = await supabase.from('profiles').select('*').eq('email', normalizedEmail).single();
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
    const normalizedEmails = emails.map(normalizeEmail);
    if (!hasSupabase) return store.profiles.filter((profile) => normalizedEmails.includes(profile.email));
    const { data, error } = await supabase.from('profiles').select('*').in('email', normalizedEmails);
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
