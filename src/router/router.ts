import { Router } from 'express';

import { SearchController, UserController, DialogController, FileController } from '../controllers';
import { authMiddlware } from '../middlewares';

export const createRouter = (io: IO.Server) => {
  const router = Router();

  const dialogController = new DialogController(io);
  const userController = new UserController();
  const searchController = new SearchController();
  const fileController = new FileController();

  router.post('/registration', userController.registration);
  router.post('/verify/:id', userController.verify);
  router.post('/login', userController.login);
  router.post('/logout', userController.logout);
  router.post('/update', authMiddlware, userController.update);
  router.get('/refresh', userController.refresh);
  router.get('/search', authMiddlware, searchController.search);

  router.get('/dialogs', authMiddlware, dialogController.getAll);
  router.post('/dialogs/reorder', authMiddlware, dialogController.reorder);
  router.post('/dialogs/pin', authMiddlware, dialogController.pin);
  router.post('/dialogs/unpin', authMiddlware, dialogController.unpin);

  router.post('/upload', fileController.upload);

  return router;
};
