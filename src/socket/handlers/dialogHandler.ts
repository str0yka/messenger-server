import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  const { id: userId, email: userEmail } = socket.data;

  socket.on('dialog:join', async (dialogId) => {
    const dialogData = await dialogService.get(dialogId);

    socket.join(`dialog-${dialogId}`);

    socket.emit('dialog:put', dialogData);
  });

  socket.on('dialog:leave', (dialogId) => {
    socket.leave(`dialog-${dialogId}`);

    socket.emit('dialog:put', null);
  });

  socket.on('dialogs:create', async (partnerId, partnerEmail) => {
    const { dialogs } = await dialogService.create(
      {
        userId,
        userEmail,
      },
      {
        partnerId,
        partnerEmail,
      },
    );

    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('dialogs:updateRequired'); // $FIXME (dialog:update)
  });

  socket.on('dialogs:get', async () => {
    const dialogs = await dialogService.getAll(userId);

    socket.emit('dialogs:put', dialogs);
  });
};
