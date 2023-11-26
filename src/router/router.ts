import { Router } from 'express';

import { userController } from '../controllers/index.js';

export const router = Router();

router.post('/registration', userController.registration);
router.post('/verify/:id', userController.verify);
router.post('/login', userController.login);
router.post('/logout');
router.get('/refresh');
