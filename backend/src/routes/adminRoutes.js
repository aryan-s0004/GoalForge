import express from 'express';
import {
  createSharedGoal, getAllGoals, unlockGoal, getAuditLogs, getUsers, getSharedGoals,
  getEscalations, resolveEscalation, triggerMockEscalations, resetDemoData
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
router.get('/escalations', getEscalations);
router.put('/escalations/:id/resolve', resolveEscalation);
router.post('/escalations/trigger', triggerMockEscalations);
router.post('/reset-demo', resetDemoData);

export default router;
