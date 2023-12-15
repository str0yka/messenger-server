import { Router } from 'express';

import { messageController, userController, dialogController } from '../controllers/index.js';
import { authMiddlware } from '../middlewares/index.js';

export const router = Router();

router.post('/registration', userController.registration);
router.post('/verify/:id', userController.verify);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/refresh', userController.refresh);
router.get('/search', authMiddlware, userController.search);
router.post('/send', authMiddlware, messageController.send);
router.get('/dialogs', authMiddlware, dialogController.getAll);
