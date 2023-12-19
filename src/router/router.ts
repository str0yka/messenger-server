import { Router } from 'express';

import { userController } from '../controllers';
import { authMiddlware } from '../middlewares';

export const router = Router();

router.post('/registration', userController.registration);
router.post('/verify/:id', userController.verify);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/refresh', userController.refresh);
router.get('/search', authMiddlware, userController.search);
