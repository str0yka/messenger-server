import { Router } from 'express';

export const router = Router();

router.post('/registration');
router.post('/login');
router.post('/logout');
router.get('/verify/:link');
router.get('/refresh');
