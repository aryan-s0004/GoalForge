import express from 'express';
import {
  createSharedGoal, getAllGoals, unlockGoal, getAuditLogs, getUsers, getSharedGoals
} from '../controllers/adminController.js';
import { auth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

router.post('/shared-goal', createSharedGoal);
router.get('/shared-goals', getSharedGoals);
router.get('/goals', getAllGoals);
router.put('/goals/:id/unlock', unlockGoal);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getUsers);

export default router;
