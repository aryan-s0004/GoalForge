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
    if (req.user.role.toUpperCase() !== 'EMPLOYEE') {
      return next(new AppError('Only employees can create personal goals', 403));
    }
    const payload = req.validatedBody;

    const goals = await db.listGoalsForUser(req.user.id);
    if (goals.length >= 8) return next(new AppError('Maximum 8 goals allowed', 400));
    if (goals.some((g) => g.status === 'SUBMITTED' || g.status === 'APPROVED')) {
      return next(new AppError('Cannot add goals when team set is locked or pending approval', 400));
    }

    const total = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
    if (total + payload.weightage > 100) {
      return next(new AppError(`Total weightage cannot exceed 100% (current: ${total}%)`, 400));
    }

    const goal = await db.createGoal({
      employeeId: req.user.id,
      title: payload.title,
      description: payload.description || '',
      thrustArea: payload.thrust_area || 'General',
      uomType: payload.uom || payload.uomType || 'numeric',
      target: Number(payload.target_value ?? payload.target),
      weightage: Number(payload.weightage),
      status: 'DRAFT',
      quarter: 'Q2-2026',
    });

    await db.createAuditLog({
      action: 'GOAL_CREATED',
      performedBy: req.user.id,
      entityType: 'goal',
      entityId: goal.id,
      newData: goal,
      notes: `Goal "${goal.title}" created in draft`,
    });

    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await db.findGoal(req.params.id);
    if (!goal || goal.employeeId !== req.user.id) return next(new AppError('Goal not found', 404));
    if (goal.locked) return next(new AppError('Goal locked and cannot be edited', 400));
    if (goal.status === 'SUBMITTED' || goal.status === 'APPROVED') {
      return next(new AppError('Cannot edit goals after they are submitted or approved', 400));
    }

    const patch = req.validatedBody;
    if (!Object.keys(patch).length) return next(new AppError('Nothing to update', 400));

    // Normalize field names
    const normalizedPatch = {};
    if (patch.title !== undefined) normalizedPatch.title = patch.title;
    if (patch.description !== undefined) normalizedPatch.description = patch.description;
    if (patch.thrust_area !== undefined) normalizedPatch.thrustArea = patch.thrust_area;
    if (patch.uom !== undefined || patch.uomType !== undefined) normalizedPatch.uomType = patch.uom || patch.uomType;
    if (patch.target_value !== undefined || patch.target !== undefined) normalizedPatch.target = Number(patch.target_value ?? patch.target);
    
    if (patch.weightage !== undefined) {
      normalizedPatch.weightage = Number(patch.weightage);
      const goals = await db.listGoalsForUser(req.user.id);
      const totalOther = goals
        .filter((g) => g.id !== req.params.id)
        .reduce((sum, g) => sum + Number(g.weightage || 0), 0);
      if (totalOther + normalizedPatch.weightage > 100) {
        return next(new AppError(`Total weightage cannot exceed 100% (current without this goal: ${totalOther}%)`, 400));
      }
    }

    const updated = await db.updateGoal(req.params.id, normalizedPatch);

    await db.createAuditLog({
      action: 'GOAL_UPDATED',
      performedBy: req.user.id,
      entityType: 'goal',
      entityId: req.params.id,
      oldData: goal,
      newData: updated,
      notes: `Goal parameters updated by ${req.user.name}`,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const submitGoals = async (req, res, next) => {
  try {
    const goals = await db.listGoalsForUser(req.user.id);
    if (!goals.length) return next(new AppError('No goals found to submit', 400));
    if (goals.length > 8) return next(new AppError('Maximum 8 goals allowed', 400));

    const total = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
    if (total !== 100) return next(new AppError(`Total weightage must equal exactly 100% (current: ${total}%)`, 400));
    
    if (goals.some((g) => Number(g.weightage) < 10)) {
      return next(new AppError('Each goal must have a minimum weightage of 10%', 400));
    }

    await db.updateDraftGoalsForUser(req.user.id, { status: 'SUBMITTED' });
    
    const draftIds = goals.filter(g => g.status === 'DRAFT' || g.status === 'REJECTED').map(g => g.id);
    
    await db.createAuditLog({
      action: 'GOALS_SUBMITTED',
      performedBy: req.user.id,
      entityType: 'goal',
      notes: `Submitted ${draftIds.length} goals for supervisor approval. Total weightage: 100%`,
    });

    // Notify manager
    const managerId = req.user.managerId;
    if (managerId) {
      await db.createNotification({
        userId: managerId,
        title: 'Goals Submitted',
        message: `${req.user.name} submitted their Q2 goals for approval.`,
      });
    }

    res.json({ message: 'Goals submitted successfully for approval' });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (req, res, next) => {
  try {
    const role = req.user.role.toUpperCase();
    if (!['MANAGER', 'ADMIN'].includes(role)) {
      return next(new AppError('Supervisor access required', 403));
    }
    if (role === 'ADMIN') {
      const allGoals = await db.listAllGoals();
      return res.json(allGoals.filter((g) => g.status === 'SUBMITTED'));
    }
    res.json(await db.listPendingForManager(req.user.id));
  } catch (error) {
    next(error);
  }
};

export const approveGoal = async (req, res, next) => {
  try {
    const role = req.user.role.toUpperCase();
    if (!['MANAGER', 'ADMIN'].includes(role)) return next(new AppError('Not authorized', 403));

    const existing = await db.findGoal(req.params.goalId);
    if (!existing) return next(new AppError('Goal not found', 404));
    if (!(await canReviewGoal(req.user, existing))) {
      return next(new AppError('You can only review goals for your team', 403));
    }
    if (existing.status !== 'SUBMITTED') return next(new AppError('Only submitted goals can be approved', 400));

    const goal = await db.updateGoal(req.params.goalId, {
      status: 'APPROVED',
      locked: true,
      managerFeedback: '',
    });

    await db.createAuditLog({
      action: 'GOAL_APPROVED',
      performedBy: req.user.id,
      entityType: 'goal',
      entityId: req.params.goalId,
      oldData: existing,
      newData: goal,
      notes: 'Goal approved and locked',
    });

    // Notify employee
    await db.createNotification({
      userId: existing.employeeId,
      title: 'Goal Approved',
      message: `Your goal "${existing.title}" was approved and locked by Kavita Nair.`,
    });

    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const rejectGoal = async (req, res, next) => {
  try {
    const role = req.user.role.toUpperCase();
    if (!['MANAGER', 'ADMIN'].includes(role)) return next(new AppError('Not authorized', 403));

    const existing = await db.findGoal(req.params.goalId);
    if (!existing) return next(new AppError('Goal not found', 404));
    if (!(await canReviewGoal(req.user, existing))) {
      return next(new AppError('You can only review goals for your team', 403));
    }
    if (existing.status !== 'SUBMITTED') return next(new AppError('Only submitted goals can be rejected', 400));

    const { feedback } = req.body || {};
    if (!feedback) return next(new AppError('Feedback comment is required for rejection', 400));

    const goal = await db.updateGoal(req.params.goalId, {
      status: 'REJECTED',
      locked: false,
      managerFeedback: feedback,
    });

    await db.createAuditLog({
      action: 'GOAL_REJECTED',
      performedBy: req.user.id,
      entityType: 'goal',
      entityId: req.params.goalId,
      oldData: existing,
      newData: goal,
      notes: `Goal rejected. Reason: "${feedback}"`,
    });

    // Notify employee
    await db.createNotification({
      userId: existing.employeeId,
      title: 'Goal Rejected',
      message: `Your goal "${existing.title}" was rejected. Feedback: "${feedback}". Please revise and resubmit.`,
    });

    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const editPendingGoal = async (req, res, next) => {
  try {
    const role = req.user.role.toUpperCase();
    if (!['MANAGER', 'ADMIN'].includes(role)) return next(new AppError('Not authorized', 403));

    const existing = await db.findGoal(req.params.goalId);
    if (!existing) return next(new AppError('Goal not found', 404));
    if (!(await canReviewGoal(req.user, existing))) {
      return next(new AppError('You can only review goals for your team', 403));
    }
    if (existing.status !== 'SUBMITTED') return next(new AppError('Only submitted goals can be edited', 400));

    const { target_value, target, weightage } = req.body || {};
    const patch = {};
    const rawTarget = target_value ?? target;
    if (rawTarget !== undefined) {
      const parsed = Number(rawTarget);
      if (!Number.isFinite(parsed)) return next(new AppError('Target must be a valid number', 400));
      patch.target = parsed;
    }
    if (weightage !== undefined) {
      const parsed = Number(weightage);
      if (!Number.isFinite(parsed) || parsed < 10 || parsed > 100) {
        return next(new AppError('Weightage must be between 10 and 100', 400));
      }
      patch.weightage = parsed;
    }
    if (!Object.keys(patch).length) return next(new AppError('Nothing to update', 400));

    const goal = await db.updateGoal(req.params.goalId, patch);

    await db.createAuditLog({
      action: 'MANAGER_EDIT',
      performedBy: req.user.id,
      entityType: 'goal',
      entityId: req.params.goalId,
      oldData: existing,
      newData: goal,
      notes: `Supervisor adjusted goal parameters`,
    });

    // Notify employee
    await db.createNotification({
      userId: existing.employeeId,
      title: 'Goal Adjusted by Supervisor',
      message: `Your goal "${existing.title}" target or weightage was updated by Kavita Nair.`,
    });

    res.json(goal);
  } catch (error) {
    next(error);
  }
};
