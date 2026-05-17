import express from 'express';
import { getNotifications, markNotificationsAsRead } from '../controllers/notificationController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getNotifications);
router.post('/read', markNotificationsAsRead);

export default router;
