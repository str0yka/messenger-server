import { dialogService } from '../services/index.js';

class DialogController {
  async getAll(req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) {
    try {
      const userId = req.user.id;

      const dialogs = await dialogService.getAll(userId);

      return res.json(dialogs);
    } catch (e) {
      next(e);
    }
  }
}

export const dialogController = new DialogController();
