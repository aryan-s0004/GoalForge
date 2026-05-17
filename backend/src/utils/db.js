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
    // Arjun Mehta — Employee (mixed statuses for rich dashboard)
    { id: 'goal-1', employeeId: 'emp-1', title: 'Increase partner activation rate by 20%', description: 'Activate distributor partners in the west region through targeted outreach campaigns and onboarding optimization.', uomType: 'percent', target: 20, weightage: 30, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-2', employeeId: 'emp-1', title: 'Reduce support ticket TAT to under 4 hours', description: 'Bring down average customer support ticket turnaround time from 8 hours to under 4 hours.', uomType: 'numeric', target: 4, weightage: 25, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-3', employeeId: 'emp-1', title: 'Improve customer retention to 95%', description: 'Implement proactive engagement strategies to improve quarterly customer retention metrics.', uomType: 'percent', target: 95, weightage: 25, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-4', employeeId: 'emp-1', title: 'Launch automated onboarding flow', description: 'Design and ship self-serve onboarding for new enterprise clients, reducing manual effort by 60%.', uomType: 'percent', target: 60, weightage: 20, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },

    // Priya Sharma — submitted goals (pending manager approval)
    { id: 'goal-5', employeeId: 'emp-2', title: 'Ship QA automation suite', description: 'Automate smoke and regression coverage for all core release journeys.', uomType: 'numeric', target: 40, weightage: 35, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-6', employeeId: 'emp-2', title: 'Reduce deployment failures by 50%', description: 'Implement CI/CD guardrails and staged rollout practices.', uomType: 'percent', target: 50, weightage: 30, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-7', employeeId: 'emp-2', title: 'Mentor 2 junior developers', description: 'Conduct weekly 1:1s and pair programming sessions with new hires.', uomType: 'numeric', target: 2, weightage: 35, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },

    // Rohit Kapoor — approved & locked
    { id: 'goal-8', employeeId: 'emp-3', title: 'Close 15 enterprise deals', description: 'Focus on mid-market and enterprise segments with deal sizes above $50K ARR.', uomType: 'numeric', target: 15, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-9', employeeId: 'emp-3', title: 'Grow pipeline to $2M', description: 'Build qualified pipeline through outbound campaigns and partner referrals.', uomType: 'numeric', target: 2000000, weightage: 35, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-10', employeeId: 'emp-3', title: 'Improve win rate to 30%', description: 'Optimize sales process and demo quality to convert more qualified opportunities.', uomType: 'percent', target: 30, weightage: 25, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },

    // Sneha Patel — mixed with a rejected goal
    { id: 'goal-11', employeeId: 'emp-4', title: 'Launch product analytics dashboard', description: 'Build an internal analytics dashboard for tracking feature adoption metrics.', uomType: 'percent', target: 100, weightage: 40, status: 'APPROVED', locked: true, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-12', employeeId: 'emp-4', title: 'Reduce page load time to under 2s', description: 'Optimize frontend bundle and API response times for core user journeys.', uomType: 'numeric', target: 2, weightage: 30, status: 'REJECTED', locked: false, quarter: 'Q2-2026', managerFeedback: 'Target too aggressive for this quarter. Consider 3s first, then iterate.', createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-13', employeeId: 'emp-4', title: 'Conduct 10 user research sessions', description: 'Interview enterprise users to gather insights for Q3 roadmap planning.', uomType: 'numeric', target: 10, weightage: 30, status: 'SUBMITTED', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },

    // Vikram Singh — all draft
    { id: 'goal-14', employeeId: 'emp-5', title: 'Onboard 25 SMB accounts', description: 'Expand into the SMB segment through self-serve and assisted onboarding.', uomType: 'numeric', target: 25, weightage: 50, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'goal-15', employeeId: 'emp-5', title: 'Achieve 90% CSAT score', description: 'Maintain customer satisfaction through responsive support and proactive check-ins.', uomType: 'percent', target: 90, weightage: 50, status: 'DRAFT', locked: false, quarter: 'Q2-2026', managerFeedback: null, createdAt: new Date(), updatedAt: new Date() },
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
      return prisma.goal.findMany({ where: { employeeId: userId }, orderBy: { createdAt: 'asc' } });
    }
    return store.goals.filter((g) => g.employeeId === userId);
  },

  async createGoal(data) {
    if (usePrisma) {
      return prisma.goal.create({ data });
    }
    const goal = { id: nextId('goal'), locked: false, managerFeedback: null, createdAt: new Date(), updatedAt: new Date(), ...data };
    store.goals.push(goal);
    return goal;
  },

  async findGoal(id) {
    if (usePrisma) {
      return prisma.goal.findUnique({ where: { id } });
    }
    return store.goals.find((g) => g.id === id) || null;
  },

  async updateGoal(id, patch) {
    if (usePrisma) {
      return prisma.goal.update({ where: { id }, data: { ...patch, updatedAt: new Date() } });
    }
    const idx = store.goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    store.goals[idx] = { ...store.goals[idx], ...patch, updatedAt: new Date() };
    return store.goals[idx];
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
      return prisma.goal.findMany({
        where: { employeeId: { in: teamIds }, status: 'SUBMITTED' },
        include: { employee: { select: { id: true, name: true, email: true, department: true } } },
      });
    }
    const teamIds = store.users.filter((u) => u.managerId === managerId).map((u) => u.id);
    return store.goals
      .filter((g) => teamIds.includes(g.employeeId) && g.status === 'SUBMITTED')
      .map((g) => ({ ...g, employee: store.users.find((u) => u.id === g.employeeId) }));
  },

  async listAllGoals() {
    if (usePrisma) {
      return prisma.goal.findMany({
        orderBy: { createdAt: 'asc' },
        include: { employee: { select: { id: true, name: true, email: true, role: true, department: true } } },
      });
    }
    return store.goals.map((g) => ({ ...g, employee: store.users.find((u) => u.id === g.employeeId) }));
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
        take: 50,
        include: { performer: { select: { name: true, email: true } }, goal: { select: { title: true } } },
      });
    }
    return store.auditLogs.map((log) => ({
      ...log,
      performer: store.users.find((u) => u.id === log.performedBy),
      goal: store.goals.find((g) => g.id === log.entityId),
    }));
  },

  /* ---- Helpers ---- */
  async listUsersByEmails(emails) {
    const normalized = emails.map((e) => e.trim().toLowerCase());
    if (usePrisma) {
      return prisma.user.findMany({ where: { email: { in: normalized } } });
    }
    return store.users.filter((u) => normalized.includes(u.email));
  },
};
