import { messageService } from '../services/index.js';

export class MessageController {
  async send(req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) {
    try {
      const { message, dialogId } = req.body;

      const dialogData = await messageService.send(message, dialogId);

      return res.json(dialogData);
    } catch (e) {
      next(e);
    }
  }
}

export const messageController = new MessageController();
