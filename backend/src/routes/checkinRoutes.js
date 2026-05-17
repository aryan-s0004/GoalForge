import express from 'express';
import { getCheckins, createCheckin, addManagerComment } from '../controllers/checkinController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/goal/:goalId', getCheckins);
router.post('/goal/:goalId', createCheckin);
router.put('/:id/comment', addManagerComment);

export default router;
