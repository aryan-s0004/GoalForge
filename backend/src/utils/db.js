/**
 * GoalForge Database Layer
 * 
 * Strategy:
 *   1. If DATABASE_URL is set → use Prisma with PostgreSQL
 *   2. If Prisma connection fails → fall back to in-memory store
 *   3. In-memory store is always seeded with demo data
 * 
 * This guarantees the demo NEVER crashes regardless of DB availability.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

/* ------------------------------------------------------------------ */
/*  Prisma client (lazy, with connection test)                        */
/* ------------------------------------------------------------------ */

let prisma = null;
let usePrisma = false;

async function initPrisma() {
  if (!process.env.DATABASE_URL) {
    console.log('[DB] No DATABASE_URL set — using in-memory store');
    return false;
  }

  try {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    await prisma.$connect();
    console.log('[DB] Connected to PostgreSQL via Prisma');
    return true;
  } catch (err) {
    console.warn('[DB] Prisma connection failed, falling back to in-memory store:', err.message);

    // Try fallback database
    if (process.env.FALLBACK_DATABASE_URL) {
      try {
        prisma = new PrismaClient({
          datasources: { db: { url: process.env.FALLBACK_DATABASE_URL } },
          log: ['error'],
        });
        await prisma.$connect();
        console.log('[DB] Connected to fallback PostgreSQL via Prisma');
        return true;
      } catch (fallbackErr) {
        console.warn('[DB] Fallback DB also failed:', fallbackErr.message);
      }
    }

    prisma = null;
    return false;
  }
}

// Initialize on module load
const prismaReady = initPrisma().then((ok) => { usePrisma = ok; });

/* ------------------------------------------------------------------ */
/*  In-memory store (always available, pre-seeded)                    */
/* ------------------------------------------------------------------ */

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const store = {
  users: [
    { id: 'emp-1', name: 'Arjun Mehta', email: 'employee@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'EMPLOYEE', department: 'Engineering', managerId: 'mgr-1', createdAt: new Date() },
    { id: 'emp-2', name: 'Priya Sharma', email: 'priya.sharma@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'EMPLOYEE', department: 'Engineering', managerId: 'mgr-1', createdAt: new Date() },
    { id: 'emp-3', name: 'Rohit Kapoor', email: 'rohit.kapoor@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'EMPLOYEE', department: 'Sales', managerId: 'mgr-2', createdAt: new Date() },
    { id: 'emp-4', name: 'Sneha Patel', email: 'sneha.patel@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'EMPLOYEE', department: 'Product', managerId: 'mgr-1', createdAt: new Date() },
    { id: 'emp-5', name: 'Vikram Singh', email: 'vikram.singh@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'EMPLOYEE', department: 'Sales', managerId: 'mgr-2', createdAt: new Date() },
    { id: 'mgr-1', name: 'Kavita Nair', email: 'manager@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'MANAGER', department: 'Engineering', managerId: null, createdAt: new Date() },
    { id: 'mgr-2', name: 'Deepak Joshi', email: 'deepak.joshi@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'MANAGER', department: 'Sales', managerId: null, createdAt: new Date() },
    { id: 'admin-1', name: 'Rajesh Kumar', email: 'admin@goalforge.com', passwordHash: DEFAULT_PASSWORD_HASH, role: 'ADMIN', department: 'HR', managerId: null, createdAt: new Date() },
  ],
  goals: [
    { id: 'goal-1', employeeId: 'emp-1', title: 'Increase partner activation rate by 20%', description: 'Activate distributor partners in the west region through targeted outreach campaigns and onboarding optimization.', thrustArea: 'Sales & Revenue', uomType: 'percent', target: 20, weightage: 30, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-2', employeeId: 'emp-1', title: 'Reduce support ticket TAT to under 4 hours', description: 'Bring down average customer support ticket turnaround time from 8 hours to under 4 hours.', thrustArea: 'Operational Excellence', uomType: 'numeric', target: 4, weightage: 25, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-3', employeeId: 'emp-1', title: 'Improve customer retention to 95%', description: 'Implement proactive engagement strategies to improve quarterly customer retention metrics.', thrustArea: 'Customer Success', uomType: 'percent', target: 95, weightage: 25, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-4', employeeId: 'emp-1', title: 'Launch automated onboarding flow', description: 'Design and ship self-serve onboarding for new enterprise clients, reducing manual effort by 60%.', thrustArea: 'Innovation & Tech', uomType: 'percent', target: 60, weightage: 20, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-5', employeeId: 'emp-2', title: 'Ship QA automation suite', description: 'Automate smoke and regression coverage for all core release journeys.', thrustArea: 'Innovation & Tech', uomType: 'numeric', target: 40, weightage: 35, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-6', employeeId: 'emp-2', title: 'Reduce deployment failures by 50%', description: 'Implement CI/CD guardrails and staged rollout practices.', thrustArea: 'Operational Excellence', uomType: 'percent', target: 50, weightage: 30, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-7', employeeId: 'emp-2', title: 'Mentor 2 junior developers', description: 'Conduct weekly 1:1s and pair programming sessions with new hires.', thrustArea: 'People & Culture', uomType: 'numeric', target: 2, weightage: 35, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-8', employeeId: 'emp-3', title: 'Close 15 enterprise deals', description: 'Focus on mid-market and enterprise segments with deal sizes above $50K ARR.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 15, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-9', employeeId: 'emp-3', title: 'Grow pipeline to $2M', description: 'Build qualified pipeline through outbound campaigns and partner referrals.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 2000000, weightage: 35, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-10', employeeId: 'emp-3', title: 'Improve win rate to 30%', description: 'Optimize sales process and demo quality to convert more qualified opportunities.', thrustArea: 'Sales & Revenue', uomType: 'percent', target: 30, weightage: 25, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-11', employeeId: 'emp-4', title: 'Launch product analytics dashboard', description: 'Build an internal analytics dashboard for tracking feature adoption metrics.', thrustArea: 'Innovation & Tech', uomType: 'percent', target: 100, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-12', employeeId: 'emp-4', title: 'Reduce page load time to under 2s', description: 'Optimize frontend bundle and API response times for core user journeys.', thrustArea: 'Innovation & Tech', uomType: 'numeric', target: 2, weightage: 30, status: 'REJECTED', locked: false, quarter: 'Q2-2026', managerFeedback: 'Target too aggressive for this quarter. Consider 3s first, then iterate.', createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-13', employeeId: 'emp-4', title: 'Conduct 10 user research sessions', description: 'Interview enterprise users to gather insights for Q3 roadmap planning.', thrustArea: 'Customer Success', uomType: 'numeric', target: 10, weightage: 30, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-14', employeeId: 'emp-5', title: 'Onboard 25 SMB accounts', description: 'Expand into the SMB segment through self-serve and assisted onboarding.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 25, weightage: 50, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-15', employeeId: 'emp-5', title: 'Achieve 90% CSAT score', description: 'Maintain customer satisfaction through responsive support and proactive check-ins.', thrustArea: 'Customer Success', uomType: 'percent', target: 90, weightage: 50, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
  ],
  checkins: [
    { id: 'checkin-1', goalId: 'goal-8', userId: 'emp-3', quarter: 'Q2-2026', achievement: 8, progress: 53, managerComment: 'Good progress, keep the momentum.', status: 'ON_TRACK', createdAt: new Date() },
    { id: 'checkin-2', goalId: 'goal-9', userId: 'emp-3', quarter: 'Q2-2026', achievement: 1200000, progress: 60, managerComment: null, status: 'ON_TRACK', createdAt: new Date() },
    { id: 'checkin-3', goalId: 'goal-11', userId: 'emp-4', quarter: 'Q2-2026', achievement: 75, progress: 75, managerComment: 'Dashboard v1 shipped. Great work.', status: 'ON_TRACK', createdAt: new Date() },
  ],
  sharedGoals: [
    { id: 'sg-1', ownerId: 'admin-1', title: 'Achieve 99.9% platform uptime', description: 'Cross-functional goal to maintain system reliability.', target: 99.9, department: 'Engineering', assignedTo: ['emp-1', 'emp-2', 'emp-4'], createdAt: new Date() },
    { id: 'sg-2', ownerId: 'admin-1', title: 'Grow quarterly revenue to $5M', description: 'Organization-wide revenue target for Q2.', target: 5000000, department: 'Sales', assignedTo: ['emp-3', 'emp-5'], createdAt: new Date() },
  ],
  auditLogs: [
    { id: 'audit-1', action: 'GOAL_APPROVED', performedBy: 'mgr-1', entityType: 'goal', entityId: 'goal-11', oldData: null, newData: null, notes: 'Manager approved analytics dashboard goal', createdAt: new Date(Date.now() - 86400000 * 3) },
    { id: 'audit-2', action: 'GOAL_REJECTED', performedBy: 'mgr-1', entityType: 'goal', entityId: 'goal-12', oldData: null, newData: null, notes: 'Target too aggressive — asked to revise', createdAt: new Date(Date.now() - 86400000 * 2) },
    { id: 'audit-3', action: 'GOAL_APPROVED', performedBy: 'mgr-2', entityType: 'goal', entityId: 'goal-8', oldData: null, newData: null, notes: 'Enterprise deal target approved and locked', createdAt: new Date(Date.now() - 86400000 * 2) },
    { id: 'audit-4', action: 'GOAL_APPROVED', performedBy: 'mgr-2', entityType: 'goal', entityId: 'goal-9', oldData: null, newData: null, notes: 'Pipeline goal approved', createdAt: new Date(Date.now() - 86400000 * 1) },
    { id: 'audit-5', action: 'GOAL_APPROVED', performedBy: 'mgr-2', entityType: 'goal', entityId: 'goal-10', oldData: null, newData: null, notes: 'Win rate improvement approved', createdAt: new Date(Date.now() - 86400000 * 1) },
    { id: 'audit-6', action: 'SHARED_GOAL_CREATED', performedBy: 'admin-1', entityType: 'shared_goal', entityId: 'sg-1', oldData: null, newData: null, notes: 'Created org-wide uptime goal', createdAt: new Date(Date.now() - 86400000 * 5) },
    { id: 'audit-7', action: 'GOAL_LOCKED', performedBy: 'mgr-2', entityType: 'goal', entityId: 'goal-8', oldData: null, newData: null, notes: 'Goal locked after approval', createdAt: new Date(Date.now() - 86400000 * 1) },
    { id: 'audit-8', action: 'CHECKIN_SUBMITTED', performedBy: 'emp-3', entityType: 'checkin', entityId: 'checkin-1', oldData: null, newData: null, notes: 'Q2 progress update — 8/15 deals closed', createdAt: new Date(Date.now() - 3600000 * 8) },
  ],
  notifications: [
    { id: 'notif-1', userId: 'emp-1', title: 'Platform Target Assigned', message: 'Platform uptime target assigned to you by Rajesh Kumar.', read: false, createdAt: new Date(Date.now() - 3600000 * 12) },
    { id: 'notif-2', userId: 'emp-4', title: 'Goal Rejected', message: 'Kavita Nair rejected your Q2 goal: "Reduce page load time". Feedback: "Target too aggressive. Consider 3s first, then iterate."', read: false, createdAt: new Date(Date.now() - 3600000 * 2) },
    { id: 'notif-3', userId: 'mgr-1', title: 'New Goal Submission', message: 'Priya Sharma submitted Q2-2026 goals for approval.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30) },
  ],
  escalations: [
    { id: 'esc-1', goalId: 'goal-12', employeeId: 'emp-4', managerId: 'mgr-1', type: 'SUBMISSION_OVERDUE', status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000) },
  ],
};

const nextId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

/* ------------------------------------------------------------------ */
/*  Unified DB interface                                              */
/* ------------------------------------------------------------------ */

export { usePrisma as hasPrisma };
export const dbReady = prismaReady;

export const db = {
  /* ---- Auth ---- */
  async findUserByEmail(email) {
    const normalized = email.trim().toLowerCase();
    if (usePrisma) {
      return prisma.user.findUnique({ where: { email: normalized } });
    }
    return store.users.find((u) => u.email === normalized) || null;
  },

  async findUserById(id) {
    if (usePrisma) {
      return prisma.user.findUnique({ where: { id } });
    }
    return store.users.find((u) => u.id === id) || null;
  },

  async createUser({ name, email, passwordHash, role, department, managerId }) {
    const normalized = email.trim().toLowerCase();
    if (usePrisma) {
      return prisma.user.create({
        data: { name, email: normalized, passwordHash, role: role || 'EMPLOYEE', department: department || 'General', managerId },
      });
    }
    const user = { id: nextId('user'), name, email: normalized, passwordHash, role: role || 'EMPLOYEE', department: department || 'General', managerId: managerId || null, createdAt: new Date() };
    store.users.push(user);
    return user;
  },

  async listUsers() {
    if (usePrisma) {
      return prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true, role: true, department: true, managerId: true, createdAt: true } });
    }
    return store.users.map(({ passwordHash, ...rest }) => rest).sort((a, b) => a.email.localeCompare(b.email));
  },

  /* ---- Goals ---- */
  async listGoalsForUser(userId) {
    if (usePrisma) {
      const list = await prisma.goal.findMany({ where: { employeeId: userId }, orderBy: { createdAt: 'asc' } });
      return list.map((g) => ({ ...g, thrust_area: g.thrustArea }));
    }
    return store.goals.filter((g) => g.employeeId === userId).map((g) => ({ ...g, thrust_area: g.thrustArea || g.thrust_area || 'General' }));
  },

  async createGoal(data) {
    // Sync field names
    const { thrust_area, ...rest } = data;
    const dbData = { ...rest };
    if (thrust_area !== undefined) dbData.thrustArea = thrust_area;

    if (usePrisma) {
      const created = await prisma.goal.create({ data: dbData });
      return { ...created, thrust_area: created.thrustArea };
    }
    const goal = { id: nextId('goal'), locked: false, managerFeedback: null, thrustArea: 'General', thrust_area: 'General', createdAt: new Date(), updatedAt: new Date(), ...dbData };
    if (dbData.thrustArea) goal.thrust_area = dbData.thrustArea;
    store.goals.push(goal);
    return goal;
  },

  async findGoal(id) {
    if (usePrisma) {
      const g = await prisma.goal.findUnique({ where: { id } });
      return g ? { ...g, thrust_area: g.thrustArea } : null;
    }
    const g = store.goals.find((g) => g.id === id) || null;
    return g ? { ...g, thrust_area: g.thrustArea || g.thrust_area || 'General' } : null;
  },

  async updateGoal(id, patch) {
    // Sync field names
    const { thrust_area, ...rest } = patch;
    const dbData = { ...rest };
    if (thrust_area !== undefined) dbData.thrustArea = thrust_area;

    if (usePrisma) {
      const updated = await prisma.goal.update({ where: { id }, data: { ...dbData, updatedAt: new Date() } });
      return { ...updated, thrust_area: updated.thrustArea };
    }
    const idx = store.goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    store.goals[idx] = { ...store.goals[idx], ...dbData, updatedAt: new Date() };
    if (dbData.thrustArea) store.goals[idx].thrust_area = dbData.thrustArea;
    return { ...store.goals[idx], thrust_area: store.goals[idx].thrustArea };
  },

  async updateDraftGoalsForUser(userId, patch) {
    if (usePrisma) {
      return prisma.goal.updateMany({ where: { employeeId: userId, status: 'DRAFT' }, data: patch });
    }
    store.goals = store.goals.map((g) =>
      g.employeeId === userId && g.status === 'DRAFT' ? { ...g, ...patch, updatedAt: new Date() } : g
    );
  },

  async listPendingForManager(managerId) {
    if (usePrisma) {
      const teamIds = (await prisma.user.findMany({ where: { managerId }, select: { id: true } })).map((u) => u.id);
      if (!teamIds.length) return [];
      const list = await prisma.goal.findMany({
        where: { employeeId: { in: teamIds }, status: 'SUBMITTED' },
        include: { employee: { select: { id: true, name: true, email: true, department: true } } },
      });
      return list.map((g) => ({ ...g, thrust_area: g.thrustArea }));
    }
    const teamIds = store.users.filter((u) => u.managerId === managerId).map((u) => u.id);
    return store.goals
      .filter((g) => teamIds.includes(g.employeeId) && g.status === 'SUBMITTED')
      .map((g) => ({ ...g, thrust_area: g.thrustArea || g.thrust_area || 'General', employee: store.users.find((u) => u.id === g.employeeId) }));
  },

  async listAllGoals() {
    if (usePrisma) {
      const list = await prisma.goal.findMany({
        orderBy: { createdAt: 'asc' },
        include: { employee: { select: { id: true, name: true, email: true, role: true, department: true } } },
      });
      return list.map((g) => ({ ...g, thrust_area: g.thrustArea }));
    }
    return store.goals.map((g) => ({ ...g, thrust_area: g.thrustArea || g.thrust_area || 'General', employee: store.users.find((u) => u.id === g.employeeId) }));
  },

  /* ---- Shared Goals ---- */
  async createSharedGoal(data) {
    if (usePrisma) {
      return prisma.sharedGoal.create({ data });
    }
    const sg = { id: nextId('sg'), createdAt: new Date(), ...data };
    store.sharedGoals.push(sg);
    return sg;
  },

  async listSharedGoals() {
    if (usePrisma) {
      return prisma.sharedGoal.findMany({ orderBy: { createdAt: 'desc' }, include: { owner: { select: { name: true, email: true } } } });
    }
    return store.sharedGoals.map((sg) => ({ ...sg, owner: store.users.find((u) => u.id === sg.ownerId) }));
  },

  /* ---- Checkins ---- */
  async createCheckin(data) {
    if (usePrisma) {
      return prisma.checkin.create({ data });
    }
    const checkin = { id: nextId('checkin'), createdAt: new Date(), ...data };
    store.checkins.push(checkin);
    return checkin;
  },

  async listCheckinsForGoal(goalId) {
    if (usePrisma) {
      return prisma.checkin.findMany({ where: { goalId }, orderBy: { createdAt: 'desc' } });
    }
    return store.checkins.filter((c) => c.goalId === goalId);
  },

  async updateCheckin(id, patch) {
    if (usePrisma) {
      return prisma.checkin.update({ where: { id }, data: patch });
    }
    const idx = store.checkins.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    store.checkins[idx] = { ...store.checkins[idx], ...patch };
    return store.checkins[idx];
  },

  async findCheckin(id) {
    if (usePrisma) {
      return prisma.checkin.findUnique({ where: { id } });
    }
    return store.checkins.find((c) => c.id === id) || null;
  },

  /* ---- Notifications ---- */
  async listNotificationsForUser(userId) {
    if (usePrisma) {
      return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }
    return store.notifications.filter((n) => n.userId === userId);
  },

  async createNotification({ userId, title, message }) {
    if (usePrisma) {
      return prisma.notification.create({ data: { userId, title, message } });
    }
    const notification = { id: nextId('notif'), userId, title, message, read: false, createdAt: new Date() };
    store.notifications.unshift(notification);
    return notification;
  },

  async markNotificationsAsRead(userId) {
    if (usePrisma) {
      return prisma.notification.updateMany({ where: { userId }, data: { read: true } });
    }
    store.notifications = store.notifications.map((n) => n.userId === userId ? { ...n, read: true } : n);
    return true;
  },

  /* ---- Escalations ---- */
  async listEscalations() {
    if (usePrisma) {
      return prisma.escalation.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { name: true, email: true, department: true } },
          manager: { select: { name: true, email: true } },
          goal: { select: { title: true } }
        }
      });
    }
    return store.escalations.map((e) => ({
      ...e,
      employee: store.users.find((u) => u.id === e.employeeId),
      manager: store.users.find((u) => u.id === e.managerId),
      goal: store.goals.find((g) => g.id === e.goalId),
    }));
  },

  async createEscalation({ goalId, employeeId, managerId, type }) {
    if (usePrisma) {
      return prisma.escalation.create({ data: { goalId, employeeId, managerId, type } });
    }
    const esc = { id: nextId('esc'), goalId, employeeId, managerId, type, status: 'ACTIVE', createdAt: new Date() };
    store.escalations.unshift(esc);
    return esc;
  },

  async resolveEscalation(id) {
    if (usePrisma) {
      return prisma.escalation.update({ where: { id }, data: { status: 'RESOLVED' } });
    }
    const idx = store.escalations.findIndex((e) => e.id === id);
    if (idx !== -1) {
      store.escalations[idx].status = 'RESOLVED';
    }
    return true;
  },

  /* ---- Audit Logs ---- */
  async createAuditLog(data) {
    if (usePrisma) {
      return prisma.auditLog.create({ data });
    }
    store.auditLogs.unshift({ id: nextId('audit'), createdAt: new Date(), ...data });
  },

  async listAuditLogs() {
    if (usePrisma) {
      return prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { performer: { select: { name: true, email: true, role: true } }, goal: { select: { title: true } } },
      });
    }
    return store.auditLogs.map((log) => {
      const perf = store.users.find((u) => u.id === log.performedBy);
      return {
        ...log,
        performer: perf ? { name: perf.name, email: perf.email, role: perf.role } : null,
        goal: store.goals.find((g) => g.id === log.entityId),
      };
    });
  },

  /* ---- Helpers ---- */
  async listUsersByEmails(emails) {
    const normalized = emails.map((e) => e.trim().toLowerCase());
    if (usePrisma) {
      return prisma.user.findMany({ where: { email: { in: normalized } } });
    }
    return store.users.filter((u) => normalized.includes(u.email));
  },

  /* ---- Demo Control Panel Reset ---- */
  async resetDemoData() {
    console.log('[DB] Running deterministic demo database reset');
    
    if (usePrisma) {
      try {
        await prisma.checkin.deleteMany({});
        await prisma.escalation.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.goal.deleteMany({});
        await prisma.sharedGoal.deleteMany({});

        // Arjun
        const arjun = await prisma.user.findUnique({ where: { email: 'employee@goalforge.com' } });
        const priya = await prisma.user.findUnique({ where: { email: 'priya.sharma@goalforge.com' } });
        const rohit = await prisma.user.findUnique({ where: { email: 'rohit.kapoor@goalforge.com' } });
        const sneha = await prisma.user.findUnique({ where: { email: 'sneha.patel@goalforge.com' } });
        const vikram = await prisma.user.findUnique({ where: { email: 'vikram.singh@goalforge.com' } });
        const kavita = await prisma.user.findUnique({ where: { email: 'manager@goalforge.com' } });
        const adminUser = await prisma.user.findUnique({ where: { email: 'admin@goalforge.com' } });

        if (arjun && priya && rohit && sneha && vikram && adminUser && kavita) {
          // Seed goals
          const g1 = await prisma.goal.create({ data: { employeeId: arjun.id, title: 'Increase partner activation rate by 20%', description: 'Activate distributor partners in the west region through targeted outreach.', thrustArea: 'Sales & Revenue', uomType: 'percent', target: 20, weightage: 30, status: 'DRAFT', quarter: 'Q2-2026' } });
          const g2 = await prisma.goal.create({ data: { employeeId: arjun.id, title: 'Reduce support ticket TAT to under 4 hours', description: 'Bring down support ticket average response time.', thrustArea: 'Operational Excellence', uomType: 'numeric', target: 4, weightage: 25, status: 'DRAFT', quarter: 'Q2-2026' } });
          const g3 = await prisma.goal.create({ data: { employeeId: arjun.id, title: 'Improve customer retention to 95%', description: 'Strategies to improve customer retention metrics.', thrustArea: 'Customer Success', uomType: 'percent', target: 95, weightage: 25, status: 'DRAFT', quarter: 'Q2-2026' } });
          const g4 = await prisma.goal.create({ data: { employeeId: arjun.id, title: 'Launch automated onboarding flow', description: 'Design automated self-serve flows.', thrustArea: 'Innovation & Tech', uomType: 'percent', target: 60, weightage: 20, status: 'DRAFT', quarter: 'Q2-2026' } });

          await prisma.goal.create({ data: { employeeId: priya.id, title: 'Ship QA automation suite', description: 'Automate smoke and regression coverage.', thrustArea: 'Innovation & Tech', uomType: 'numeric', target: 40, weightage: 35, status: 'SUBMITTED', quarter: 'Q2-2026' } });
          await prisma.goal.create({ data: { employeeId: priya.id, title: 'Reduce deployment failures by 50%', description: 'CI/CD practices.', thrustArea: 'Operational Excellence', uomType: 'percent', target: 50, weightage: 30, status: 'SUBMITTED', quarter: 'Q2-2026' } });
          await prisma.goal.create({ data: { employeeId: priya.id, title: 'Mentor 2 junior developers', description: 'Weekly 1:1 sessions.', thrustArea: 'People & Culture', uomType: 'numeric', target: 2, weightage: 35, status: 'SUBMITTED', quarter: 'Q2-2026' } });

          const g8 = await prisma.goal.create({ data: { employeeId: rohit.id, title: 'Close 15 enterprise deals', description: 'Deal size above $50K ARR.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 15, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026' } });
          const g9 = await prisma.goal.create({ data: { employeeId: rohit.id, title: 'Grow pipeline to $2M', description: 'Pipeline through campaigns.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 2000000, weightage: 35, status: 'APPROVED', locked: true, quarter: 'Q2-2026' } });
          await prisma.goal.create({ data: { employeeId: rohit.id, title: 'Improve win rate to 30%', description: 'Demo quality conversions.', thrustArea: 'Sales & Revenue', uomType: 'percent', target: 30, weightage: 25, status: 'APPROVED', locked: true, quarter: 'Q2-2026' } });

          const g11 = await prisma.goal.create({ data: { employeeId: sneha.id, title: 'Launch product analytics dashboard', description: 'Internal dashboard analytics.', thrustArea: 'Innovation & Tech', uomType: 'percent', target: 100, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026' } });
          const g12 = await prisma.goal.create({ data: { employeeId: sneha.id, title: 'Reduce page load time to under 2s', description: 'Optimize bundle size.', thrustArea: 'Innovation & Tech', uomType: 'numeric', target: 2, weightage: 30, status: 'REJECTED', locked: false, quarter: 'Q2-2026', managerFeedback: 'Target too aggressive for this quarter. Consider 3s first.' } });
          await prisma.goal.create({ data: { employeeId: sneha.id, title: 'Conduct 10 user research sessions', description: 'Interview customers.', thrustArea: 'Customer Success', uomType: 'numeric', target: 10, weightage: 30, status: 'SUBMITTED', quarter: 'Q2-2026' } });

          await prisma.goal.create({ data: { employeeId: vikram.id, title: 'Onboard 25 SMB accounts', description: 'Expand into SMB segment.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 25, weightage: 50, status: 'DRAFT', quarter: 'Q2-2026' } });
          await prisma.goal.create({ data: { employeeId: vikram.id, title: 'Achieve 90% CSAT score', description: 'Customer satisfaction metrics.', thrustArea: 'Customer Success', uomType: 'percent', target: 90, weightage: 50, status: 'DRAFT', quarter: 'Q2-2026' } });

          // Seed shared goals
          await prisma.sharedGoal.create({ data: { ownerId: adminUser.id, title: 'Achieve 99.9% platform uptime', description: 'Cross-functional goal.', target: 99.9, department: 'Engineering', assignedTo: [arjun.email, priya.email, sneha.email] } });
          await prisma.sharedGoal.create({ data: { ownerId: adminUser.id, title: 'Grow quarterly revenue to $5M', description: 'Revenue targets.', target: 5000000, department: 'Sales', assignedTo: [rohit.email, vikram.email] } });

          // Seed checkins
          await prisma.checkin.create({ data: { goalId: g8.id, userId: rohit.id, quarter: 'Q2-2026', achievement: 8, progress: 53, managerComment: 'Good progress, keep the momentum.', status: 'ON_TRACK' } });
          await prisma.checkin.create({ data: { goalId: g9.id, userId: rohit.id, quarter: 'Q2-2026', achievement: 1200000, progress: 60, status: 'ON_TRACK' } });
          await prisma.checkin.create({ data: { goalId: g11.id, userId: sneha.id, quarter: 'Q2-2026', achievement: 75, progress: 75, managerComment: 'Dashboard v1 shipped. Great work.', status: 'ON_TRACK' } });

          // Seed audit logs
          await prisma.auditLog.create({ data: { action: 'GOAL_APPROVED', performedBy: kavita.id, entityType: 'goal', entityId: g11.id, notes: 'Manager approved product analytics goal' } });
          await prisma.auditLog.create({ data: { action: 'GOAL_REJECTED', performedBy: kavita.id, entityType: 'goal', entityId: g12.id, notes: 'Target too aggressive — asked to revise' } });

          // Seed notifications
          await prisma.notification.create({ data: { userId: arjun.id, title: 'Platform Target Assigned', message: 'Platform uptime target assigned to you by Rajesh Kumar.' } });
          await prisma.notification.create({ data: { userId: sneha.id, title: 'Goal Rejected', message: 'Kavita Nair rejected your Q2 goal. Feedback: Target too aggressive.' } });

          // Seed escalations
          await prisma.escalation.create({ data: { goalId: g12.id, employeeId: sneha.id, managerId: kavita.id, type: 'SUBMISSION_OVERDUE', status: 'ACTIVE' } });
        }
      } catch (prismaResetErr) {
        console.error('[DB] Prisma reset failed, falling back:', prismaResetErr.message);
      }
    }

    // Reset local store variables
    store.goals = [
      { id: 'goal-1', employeeId: 'emp-1', title: 'Increase partner activation rate by 20%', description: 'Activate distributor partners in the west region through targeted outreach campaigns and onboarding optimization.', thrustArea: 'Sales & Revenue', uomType: 'percent', target: 20, weightage: 30, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-2', employeeId: 'emp-1', title: 'Reduce support ticket TAT to under 4 hours', description: 'Bring down average customer support ticket turnaround time from 8 hours to under 4 hours.', thrustArea: 'Operational Excellence', uomType: 'numeric', target: 4, weightage: 25, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-3', employeeId: 'emp-1', title: 'Improve customer retention to 95%', description: 'Implement proactive engagement strategies to improve quarterly customer retention metrics.', thrustArea: 'Customer Success', uomType: 'percent', target: 95, weightage: 25, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-4', employeeId: 'emp-1', title: 'Launch automated onboarding flow', description: 'Design and ship self-serve onboarding for new enterprise clients, reducing manual effort by 60%.', thrustArea: 'Innovation & Tech', uomType: 'percent', target: 60, weightage: 20, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-5', employeeId: 'emp-2', title: 'Ship QA automation suite', description: 'Automate smoke and regression coverage for all core release journeys.', thrustArea: 'Innovation & Tech', uomType: 'numeric', target: 40, weightage: 35, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-6', employeeId: 'emp-2', title: 'Reduce deployment failures by 50%', description: 'Implement CI/CD guardrails and staged rollout practices.', thrustArea: 'Operational Excellence', uomType: 'percent', target: 50, weightage: 30, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-7', employeeId: 'emp-2', title: 'Mentor 2 junior developers', description: 'Conduct weekly 1:1s and pair programming sessions with new hires.', thrustArea: 'People & Culture', uomType: 'numeric', target: 2, weightage: 35, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-8', employeeId: 'emp-3', title: 'Close 15 enterprise deals', description: 'Focus on mid-market and enterprise segments with deal sizes above $50K ARR.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 15, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-9', employeeId: 'emp-3', title: 'Grow pipeline to $2M', description: 'Build qualified pipeline through outbound campaigns and partner referrals.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 2000000, weightage: 35, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-10', employeeId: 'emp-3', title: 'Improve win rate to 30%', description: 'Optimize sales process and demo quality to convert more qualified opportunities.', thrustArea: 'Sales & Revenue', uomType: 'percent', target: 30, weightage: 25, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-11', employeeId: 'emp-4', title: 'Launch product analytics dashboard', description: 'Build an internal analytics dashboard for tracking feature adoption metrics.', thrustArea: 'Innovation & Tech', uomType: 'percent', target: 100, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-12', employeeId: 'emp-4', title: 'Reduce page load time to under 2s', description: 'Optimize frontend bundle and API response times for core user journeys.', thrustArea: 'Innovation & Tech', uomType: 'numeric', target: 2, weightage: 30, status: 'REJECTED', locked: false, quarter: 'Q2-2026', managerFeedback: 'Target too aggressive for this quarter. Consider 3s first, then iterate.', createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-13', employeeId: 'emp-4', title: 'Conduct 10 user research sessions', description: 'Interview enterprise users to gather insights for Q3 roadmap planning.', thrustArea: 'Customer Success', uomType: 'numeric', target: 10, weightage: 30, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-14', employeeId: 'emp-5', title: 'Onboard 25 SMB accounts', description: 'Expand into the SMB segment through self-serve and assisted onboarding.', thrustArea: 'Sales & Revenue', uomType: 'numeric', target: 25, weightage: 50, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'goal-15', employeeId: 'emp-5', title: 'Achieve 90% CSAT score', description: 'Maintain customer satisfaction through responsive support and proactive check-ins.', thrustArea: 'Customer Success', uomType: 'percent', target: 90, weightage: 50, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    store.checkins = [
      { id: 'checkin-1', goalId: 'goal-8', userId: 'emp-3', quarter: 'Q2-2026', achievement: 8, progress: 53, managerComment: 'Good progress, keep the momentum.', status: 'ON_TRACK', createdAt: new Date() },
      { id: 'checkin-2', goalId: 'goal-9', userId: 'emp-3', quarter: 'Q2-2026', achievement: 1200000, progress: 60, managerComment: null, status: 'ON_TRACK', createdAt: new Date() },
      { id: 'checkin-3', goalId: 'goal-11', userId: 'emp-4', quarter: 'Q2-2026', achievement: 75, progress: 75, managerComment: 'Dashboard v1 shipped. Great work.', status: 'ON_TRACK', createdAt: new Date() },
    ];
    store.notifications = [
      { id: 'notif-1', userId: 'emp-1', title: 'Platform Target Assigned', message: 'Platform uptime target assigned to you by Rajesh Kumar.', read: false, createdAt: new Date(Date.now() - 3600000 * 12) },
      { id: 'notif-2', userId: 'emp-4', title: 'Goal Rejected', message: 'Kavita Nair rejected your Q2 goal: "Reduce page load time". Feedback: "Target too aggressive. Consider 3s first, then iterate."', read: false, createdAt: new Date(Date.now() - 3600000 * 2) },
      { id: 'notif-3', userId: 'mgr-1', title: 'New Goal Submission', message: 'Priya Sharma submitted Q2-2026 goals for approval.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    ];
    store.escalations = [
      { id: 'esc-1', goalId: 'goal-12', employeeId: 'emp-4', managerId: 'mgr-1', type: 'SUBMISSION_OVERDUE', status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000) },
    ];
    store.auditLogs = [
      { id: 'audit-1', action: 'GOAL_APPROVED', performedBy: 'mgr-1', entityType: 'goal', entityId: 'goal-11', oldData: null, newData: null, notes: 'Manager approved analytics dashboard goal', createdAt: new Date(Date.now() - 86400000 * 3) },
      { id: 'audit-2', action: 'GOAL_REJECTED', performedBy: 'mgr-1', entityType: 'goal', entityId: 'goal-12', oldData: null, newData: null, notes: 'Target too aggressive — asked to revise', createdAt: new Date(Date.now() - 86400000 * 2) },
      { id: 'audit-3', action: 'GOAL_APPROVED', performedBy: 'mgr-2', entityType: 'goal', entityId: 'goal-8', oldData: null, newData: null, notes: 'Enterprise deal target approved and locked', createdAt: new Date(Date.now() - 86400000 * 2) },
      { id: 'audit-4', action: 'GOAL_APPROVED', performedBy: 'mgr-2', entityType: 'goal', entityId: 'goal-9', oldData: null, newData: null, notes: 'Pipeline goal approved', createdAt: new Date(Date.now() - 86400000 * 1) },
      { id: 'audit-5', action: 'GOAL_APPROVED', performedBy: 'mgr-2', entityType: 'goal', entityId: 'goal-10', oldData: null, newData: null, notes: 'Win rate improvement approved', createdAt: new Date(Date.now() - 86400000 * 1) },
    ];
    return true;
  },
};
