import { db } from '../utils/db.js';
import { AppError } from '../utils/AppError.js';

export const createSharedGoal = async (req, res, next) => {
  try {
    const { title, description, target, department, assigned_to_emails } = req.body;
    if (!title || !Array.isArray(assigned_to_emails) || !assigned_to_emails.length) {
      return next(new AppError('Title and assigned employee emails are required', 400));
    }
    const parsedTarget = Number(target);
    if (!Number.isFinite(parsedTarget)) return next(new AppError('Target must be a valid number', 400));

    const uniqueEmails = [...new Set(assigned_to_emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
    if (!uniqueEmails.length) return next(new AppError('At least one valid employee email is required', 400));

    const employees = await db.listUsersByEmails(uniqueEmails);

    const sharedGoal = await db.createSharedGoal({
      ownerId: req.user.id,
      title: title.trim(),
      description: (description || '').trim(),
      target: parsedTarget,
      department: (department || 'General').trim(),
      assignedTo: employees.map((e) => e.id),
    });

    // Create individual goals for each assigned employee
    await Promise.all(
      employees.map((emp) =>
        db.createGoal({
          employeeId: emp.id,
          title: title.trim(),
          description: (description || '').trim(),
          thrustArea: 'General',
          uomType: 'numeric',
          target: parsedTarget,
          weightage: 10,
          status: 'DRAFT',
          quarter: 'Q2-2026',
        })
      )
    );

    await db.createAuditLog({
      action: 'SHARED_GOAL_CREATED',
      performedBy: req.user.id,
      entityType: 'shared_goal',
      entityId: sharedGoal.id,
      notes: `Assigned "${title}" to ${employees.length} employees`,
    });

    res.status(201).json({ ...sharedGoal, assigned_count: employees.length });
  } catch (error) {
    next(error);
  }
};

export const getAllGoals = async (req, res, next) => {
  try {
    res.json(await db.listAllGoals());
  } catch (error) {
    next(error);
  }
};

export const unlockGoal = async (req, res, next) => {
  try {
    const goal = await db.updateGoal(req.params.id, { locked: false, status: 'DRAFT' });
    if (!goal) return next(new AppError('Goal not found', 404));
    await db.createAuditLog({
      action: 'GOAL_UNLOCKED',
      performedBy: req.user.id,
      entityType: 'goal',
      entityId: req.params.id,
      notes: 'Admin unlocked goal',
    });
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    res.json(await db.listAuditLogs());
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    res.json(await db.listUsers());
  } catch (error) {
    next(error);
  }
};

export const getSharedGoals = async (req, res, next) => {
  try {
    res.json(await db.listSharedGoals());
  } catch (error) {
    next(error);
  }
};

export const getEscalations = async (req, res, next) => {
  try {
    res.json(await db.listEscalations());
  } catch (error) {
    next(error);
  }
};

export const resolveEscalation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.resolveEscalation(id);
    await db.createAuditLog({
      action: 'ESCALATION_RESOLVED',
      performedBy: req.user.id,
      entityType: 'escalation',
      entityId: id,
      notes: `Admin resolved escalation id: ${id}`,
    });
    res.json({ success: true, message: 'Escalation marked as resolved' });
  } catch (error) {
    next(error);
  }
};

export const triggerMockEscalations = async (req, res, next) => {
  try {
    const goals = await db.listAllGoals();
    const eligibleGoal = goals.find((g) => g.status === 'DRAFT' || g.status === 'REJECTED');
    if (!eligibleGoal) {
      return next(new AppError('No eligible goals found to trigger an escalation', 400));
    }
    
    const employee = await db.findUserById(eligibleGoal.employeeId);
    const managerId = employee?.managerId || 'mgr-1';

    const esc = await db.createEscalation({
      goalId: eligibleGoal.id,
      employeeId: eligibleGoal.employeeId,
      managerId,
      type: eligibleGoal.status === 'REJECTED' ? 'REJECTION_STALEMATE' : 'SUBMISSION_OVERDUE',
    });

    await db.createAuditLog({
      action: 'ESCALATION_TRIGGERED',
      performedBy: req.user.id,
      entityType: 'escalation',
      entityId: esc.id,
      notes: `System auto-triggered escalation for "${eligibleGoal.title}"`,
    });

    await db.createNotification({
      userId: eligibleGoal.employeeId,
      title: 'CRITICAL ESCALATION',
      message: `Your goal "${eligibleGoal.title}" has been escalated to HR for exceeding submission window.`,
    });
    
    await db.createNotification({
      userId: managerId,
      title: 'CRITICAL ESCALATION',
      message: `Employee ${employee?.name || 'Arjun'} goal setup has been escalated to you and HR.`,
    });

    res.json({ success: true, escalation: esc });
  } catch (error) {
    next(error);
  }
};

export const resetDemoData = async (req, res, next) => {
  try {
    await db.resetDemoData();
    await db.createAuditLog({
      action: 'DEMO_DATA_RESET',
      performedBy: req.user.id,
      entityType: 'system',
      notes: 'Admin triggered deterministic demo database reset',
    });
    res.json({ success: true, message: 'Database reset to deterministic seeded state successfully' });
  } catch (error) {
    next(error);
  }
};
