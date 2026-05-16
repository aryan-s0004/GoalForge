import { db } from '../utils/db.js';
import { AppError } from '../utils/AppError.js';
import { canReviewGoal } from '../middlewares/auth.js';

export const getGoals = async (req, res, next) => {
  try {
    res.json(await db.listGoalsForUser(req.user.id));
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    if (req.user.role !== 'employee') return next(new AppError('Only employees can create personal goals', 403));
    const payload = req.validatedBody;

    const goals = await db.listGoalsForUser(req.user.id);
    if (goals.length >= 8) return next(new AppError('Maximum 8 goals allowed', 400));
    if (goals.some((goal) => goal.status !== 'draft')) return next(new AppError('Cannot add goals after submission', 400));

    const total = goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
    if (total + payload.weightage > 100) return next(new AppError(`Total weightage cannot exceed 100% (current: ${total}%)`, 400));

    const goal = await db.createGoal({
      user_id: req.user.id,
      ...payload,
      status: 'draft'
    });
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await db.findGoal(req.params.id);
    if (!goal || goal.user_id !== req.user.id) return next(new AppError('Goal not found', 404));
    if (goal.locked) return next(new AppError('Goal locked', 400));
    if (goal.status !== 'draft') return next(new AppError('Cannot edit submitted goal', 400));

    const patch = req.validatedBody;
    if (!Object.keys(patch).length) return next(new AppError('Nothing to update', 400));
    
    if (patch.weightage !== undefined) {
      const goals = await db.listGoalsForUser(req.user.id);
      const totalOtherWeightage = goals
        .filter((item) => item.id !== req.params.id)
        .reduce((sum, item) => sum + Number(item.weightage || 0), 0);
      if (totalOtherWeightage + patch.weightage > 100) {
        return next(new AppError(`Total weightage cannot exceed 100% (current without this goal: ${totalOtherWeightage}%)`, 400));
      }
    }
    res.json(await db.updateGoal(req.params.id, patch));
  } catch (error) {
    next(error);
  }
};

export const submitGoals = async (req, res, next) => {
  try {
    const goals = (await db.listGoalsForUser(req.user.id)).filter((goal) => goal.status === 'draft');
    if (!goals.length) return next(new AppError('No draft goals to submit', 400));
    if (goals.length > 8) return next(new AppError('Maximum 8 goals allowed', 400));

    const total = goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
    if (total !== 100) return next(new AppError(`Total weightage must be 100% (current: ${total}%)`, 400));
    if (goals.some((goal) => Number(goal.weightage) < 10)) return next(new AppError('Each goal needs at least 10% weightage', 400));

    await db.updateDraftGoalsForUser(req.user.id, { status: 'submitted' });
    res.json({ message: 'Goals submitted for approval' });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (req, res, next) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return next(new AppError('Manager access required', 403));
    if (req.user.role === 'admin') {
      const goals = (await db.listAllGoals()).filter((goal) => goal.status === 'submitted');
      return res.json(goals);
    }
    res.json(await db.listPendingForManager(req.user.id));
  } catch (error) {
    next(error);
  }
};

export const approveGoal = async (req, res, next) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return next(new AppError('Not authorized', 403));
    const existingGoal = await db.findGoal(req.params.goalId);
    if (!existingGoal) return next(new AppError('Goal not found', 404));
    if (!(await canReviewGoal(req.user, existingGoal))) return next(new AppError('You can only review goals for your team', 403));
    if (existingGoal.status !== 'submitted') return next(new AppError('Only submitted goals can be approved', 400));

    const goal = await db.updateGoal(req.params.goalId, { status: 'approved', locked: true, manager_feedback: '' });
    await db.createAuditLog({ goal_id: req.params.goalId, action: 'APPROVE', changed_by: req.user.id, notes: 'Manager approved goal' });
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const rejectGoal = async (req, res, next) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return next(new AppError('Not authorized', 403));
    const existingGoal = await db.findGoal(req.params.goalId);
    if (!existingGoal) return next(new AppError('Goal not found', 404));
    if (!(await canReviewGoal(req.user, existingGoal))) return next(new AppError('You can only review goals for your team', 403));
    if (existingGoal.status !== 'submitted') return next(new AppError('Only submitted goals can be rejected', 400));

    const { feedback } = req.body || {};
    if (!feedback) return next(new AppError('Feedback is required', 400));
    const goal = await db.updateGoal(req.params.goalId, { status: 'rejected', locked: false, manager_feedback: feedback });
    await db.createAuditLog({ goal_id: req.params.goalId, action: 'REJECT', changed_by: req.user.id, notes: feedback });
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const editPendingGoal = async (req, res, next) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) return next(new AppError('Not authorized', 403));
    const existingGoal = await db.findGoal(req.params.goalId);
    if (!existingGoal) return next(new AppError('Goal not found', 404));
    if (!(await canReviewGoal(req.user, existingGoal))) return next(new AppError('You can only review goals for your team', 403));
    if (existingGoal.status !== 'submitted') return next(new AppError('Only submitted goals can be edited by a reviewer', 400));

    const { target_value, weightage } = req.body || {};
    const patch = {};
    if (target_value !== undefined) {
      const parsedTarget = Number(target_value);
      if (!Number.isFinite(parsedTarget)) return next(new AppError('Target must be a valid number', 400));
      patch.target_value = parsedTarget;
    }
    if (weightage !== undefined) {
      const parsedWeightage = Number(weightage);
      if (!Number.isFinite(parsedWeightage) || parsedWeightage < 10 || parsedWeightage > 100) {
        return next(new AppError('Weightage must be between 10 and 100', 400));
      }
      patch.weightage = parsedWeightage;
    }
    if (!Object.keys(patch).length) return next(new AppError('Nothing to update', 400));

    const goal = await db.updateGoal(req.params.goalId, patch);
    await db.createAuditLog({ goal_id: req.params.goalId, action: 'MANAGER_EDIT', changed_by: req.user.id, notes: 'Manager adjusted target or weightage' });
    res.json(goal);
  } catch (error) {
    next(error);
  }
};
