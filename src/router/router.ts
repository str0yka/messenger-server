import { Router } from 'express';

import { SearchController, UserController, DialogController } from '../controllers';
import { authMiddlware } from '../middlewares';

export const createRouter = (io: IO.Server) => {
  const router = Router();

  const dialogController = new DialogController(io);
  const userController = new UserController();
  const searchController = new SearchController();

  router.post('/registration', userController.registration);
  router.post('/verify/:id', userController.verify);
  router.post('/login', userController.login);
  router.post('/logout', userController.logout);
  router.post('/update', authMiddlware, userController.update);
  router.get('/refresh', userController.refresh);
  router.get('/search', authMiddlware, searchController.search);

  router.post('/dialog/reorder', authMiddlware, dialogController.reorder);
  router.post('/dialog/pin', authMiddlware, dialogController.pin);
  router.post('/dialog/unpin', authMiddlware, dialogController.unpin);

  return router;
};
