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
