import { prisma } from '../prisma';
import { dialogService } from '../services';

export class DialogController {
  io: IO.Server;

  constructor(io: IO.Server) {
    this.io = io;
  }

  async pin(
    req: Ex.Request<object, object, { dialogId: number }>,
    res: Ex.Response<{ dialogs: { pinned: DialogDto[]; unpinned: DialogDto[] } }>,
    next: Ex.NextFunction,
  ) {
    try {
      const user = req.user!;
      const { dialogId } = req.body;

      await dialogService.pin({ dialogId, userId: user.id });
      const dialogs = await dialogService.getAll({ userId: user.id });

      return res.json({ dialogs });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }

  async unpin(
    req: Ex.Request<object, object, { dialogId: number }>,
    res: Ex.Response<{ dialogs: { pinned: DialogDto[]; unpinned: DialogDto[] } }>,
    next: Ex.NextFunction,
  ) {
    try {
      const user = req.user!;
      const { dialogId } = req.body;

      await dialogService.unpin({ dialogId, userId: user.id });
      const dialogs = await dialogService.getAll({ userId: user.id });

      return res.json({ dialogs });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }

  async reorder(
    req: Ex.Request<object, object, { dialogs: { dialogId: number; order: number }[] }>,
    res: Ex.Response<{ dialogs: { pinned: DialogDto[]; unpinned: DialogDto[] } }>,
    next: Ex.NextFunction,
  ) {
    try {
      const user = req.user!;
      const { dialogs } = req.body;

      await prisma.$transaction(
        dialogs.map(({ dialogId, order }) =>
          prisma.dialog.update({ where: { id: dialogId }, data: { pinnedOrder: order } }),
        ),
      );

      const { pinned, unpinned } = await dialogService.getAll({ userId: user.id });

      return res.json({ dialogs: { pinned, unpinned } });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
}
