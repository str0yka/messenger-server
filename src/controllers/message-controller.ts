import { messageService } from '../services/index.js';

export class MessageController {
  async send(req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) {
    try {
      const { message, toId } = req.body;
      const fromId = req.user.id;

      const dialogData = await messageService.send(message, fromId, toId);

      return res.json(dialogData);
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
}

export const messageController = new MessageController();
