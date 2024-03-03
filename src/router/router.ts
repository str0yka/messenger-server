import { Router } from 'express';

import { searchController, userController } from '../controllers';
import { authMiddlware } from '../middlewares';

export const router = Router();

router.post('/registration', userController.registration);
router.post('/verify/:id', userController.verify);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/update', authMiddlware, userController.update);
router.get('/refresh', userController.refresh);
router.get('/search', authMiddlware, searchController.search);
