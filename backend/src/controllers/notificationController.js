import { db } from '../utils/db.js';

export const getNotifications = async (req, res, next) => {
  try {
    res.json(await db.listNotificationsForUser(req.user.id));
  } catch (error) {
    next(error);
  }
};

export const markNotificationsAsRead = async (req, res, next) => {
  try {
    await db.markNotificationsAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
