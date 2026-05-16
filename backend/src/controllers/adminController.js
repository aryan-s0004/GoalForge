import { db } from '../utils/db.js';
import { AppError } from '../utils/AppError.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const cleanText = (value) => String(value || '').trim();
const toFiniteNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const createSharedGoal = async (req, res, next) => {
  try {
    const { title, description, thrust_area, uom, target_value, assigned_to_emails } = req.body;
    if (!title || !Array.isArray(assigned_to_emails) || !assigned_to_emails.length) {
      return next(new AppError('Title and assigned employee emails are required', 400));
    }
    const target = toFiniteNumber(target_value);
    if (target === null) return next(new AppError('Target must be a valid number', 400));

    const uniqueEmails = [...new Set(assigned_to_emails.map(normalizeEmail).filter(Boolean))];
    if (!uniqueEmails.length) return next(new AppError('At least one valid employee email is required', 400));

    const sharedGoal = await db.createSharedGoal({
      created_by: req.user.id,
      title: cleanText(title),
      description: cleanText(description),
      thrust_area: cleanText(thrust_area),
      uom: cleanText(uom),
      target_value: target,
      assigned_to_emails: uniqueEmails
    });

    const employees = await db.listProfilesByEmails(uniqueEmails);
    await Promise.all(employees.map((employee) => db.createGoal({
      user_id: employee.id,
      title: cleanText(title),
      description: cleanText(description),
      thrust_area: cleanText(thrust_area),
      uom: cleanText(uom),
      target_value: target,
      weightage: 10,
      status: 'draft'
    })));

    await db.createAuditLog({ goal_id: null, action: 'SHARED_GOAL', changed_by: req.user.id, notes: `Assigned ${title}` });
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
    const goal = await db.updateGoal(req.params.id, { locked: false, status: 'draft' });
    if (!goal) return next(new AppError('Goal not found', 404));
    await db.createAuditLog({ goal_id: req.params.id, action: 'UNLOCK', changed_by: req.user.id, notes: 'Admin unlocked goal' });
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
