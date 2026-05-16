import express from 'express';
import { 
  getGoals, createGoal, updateGoal, submitGoals,
  getPendingApprovals, approveGoal, rejectGoal, editPendingGoal 
} from '../controllers/goalController.js';
import { auth } from '../middlewares/auth.js';
import { validate, goalSchema, goalPatchSchema } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', auth, getGoals);
router.post('/', auth, validate(goalSchema), createGoal);
router.put('/:id', auth, validate(goalPatchSchema), updateGoal);
router.post('/submit', auth, submitGoals);

// Approval routes (could also be in a separate approvalRoutes.js, but mapping to current server.js logic)
router.get('/pending', auth, getPendingApprovals);
router.put('/:goalId/approve', auth, approveGoal);
router.put('/:goalId/reject', auth, rejectGoal);
router.put('/:goalId/edit', auth, editPendingGoal);

export default router;
