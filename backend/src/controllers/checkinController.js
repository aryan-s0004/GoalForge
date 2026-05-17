import { db } from '../utils/db.js';
import { AppError } from '../utils/AppError.js';
import { calculateProgress, getCheckinStatus } from '../utils/progressEngine.js';

export const getCheckins = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const goal = await db.findGoal(goalId);
    if (!goal) return next(new AppError('Goal not found', 404));
    
    // Auth guard: owner, manager, or admin
    const isOwner = goal.employeeId === req.user.id;
    const isManager = req.user.role === 'MANAGER' && (await db.findUserById(goal.employeeId))?.managerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isOwner && !isManager && !isAdmin) {
      return next(new AppError('Access denied', 403));
    }
    
    res.json(await db.listCheckinsForGoal(goalId));
  } catch (error) {
    next(error);
  }
};

export const createCheckin = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const { achievement } = req.body;
    
    if (achievement === undefined || isNaN(Number(achievement))) {
      return next(new AppError('Achievement value must be a valid number', 400));
    }

    const goal = await db.findGoal(goalId);
    if (!goal) return next(new AppError('Goal not found', 404));
    
    if (goal.employeeId !== req.user.id) {
      return next(new AppError('Only the goal owner can submit check-ins', 403));
    }

    if (goal.status !== 'APPROVED') {
      return next(new AppError('Can only submit check-ins for APPROVED and locked goals', 400));
    }

    // Compute progress using our scoring engine formulas
    const progress = calculateProgress(goal.uomType, goal.target, Number(achievement));
    const status = getCheckinStatus(progress);

    // Save checkin
    const checkin = await db.createCheckin({
      goalId,
      userId: req.user.id,
      quarter: goal.quarter || 'Q2-2026',
      achievement: Number(achievement),
      progress,
      status,
      managerComment: null,
    });

    // Write audit log
    await db.createAuditLog({
      action: 'CHECKIN_SUBMITTED',
      performedBy: req.user.id,
      entityType: 'checkin',
      entityId: checkin.id,
      notes: `Submitted check-in for goal: "${goal.title}". Achievement: ${achievement}, Progress: ${progress}% (${status})`,
    });

    // Notify manager
    const managerId = req.user.managerId;
    if (managerId) {
      await db.createNotification({
        userId: managerId,
        title: 'Check-in Submitted',
        message: `${req.user.name} submitted a progress check-in of ${progress}% on "${goal.title}".`,
      });
    }

    res.status(201).json(checkin);
  } catch (error) {
    next(error);
  }
};

export const addManagerComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    if (!comment || comment.trim() === '') {
      return next(new AppError('Comment is required', 400));
    }

    const checkin = await db.findCheckin(id);
    if (!checkin) return next(new AppError('Check-in not found', 404));

    const goal = await db.findGoal(checkin.goalId);
    if (!goal) return next(new AppError('Associated goal not found', 404));

    const employee = await db.findUserById(goal.employeeId);
    const isManager = req.user.role === 'MANAGER' && employee?.managerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isManager && !isAdmin) {
      return next(new AppError('Only the supervisor or HR Admin can comment on check-ins', 403));
    }

    const updated = await db.updateCheckin(id, { managerComment: comment });

    // Write audit log
    await db.createAuditLog({
      action: 'CHECKIN_COMMENTED',
      performedBy: req.user.id,
      entityType: 'checkin',
      entityId: id,
      notes: `Supervisor added check-in comment: "${comment}"`,
    });

    // Notify employee
    await db.createNotification({
      userId: goal.employeeId,
      title: 'Check-in Feedback',
      message: `${req.user.name} co-signed and left feedback on your progress check-in: "${comment}".`,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
