import express from 'express';
import { login, register, getMe } from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', auth, getMe);

export default router;
