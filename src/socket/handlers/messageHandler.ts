import { dialogService, messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('dialog:join', async (msg) => {
    const { dialogId } = msg;

    const dialogData = await dialogService.get(dialogId);

    socket.join(`dialog-${String(dialogId)}`);

    socket.emit('dialog:put', dialogData);
  });

  socket.on('dialog:leave', (msg) => {
    const { dialogId } = msg;

    socket.leave(`dialog-${String(dialogId)}`);

    socket.emit('dialog:put', null);
  });

  socket.on('dialogs:create', async (msg) => {
    const { userId, email } = socket;

    const { partnerId, partnerEmail } = msg;

    const { partnerDialogData, userDialogData } = await dialogService.create(
      {
        userId,
        userEmail: email,
      },
      {
        partnerId,
        partnerEmail,
      },
    );

    io.to(String(userDialogData.userId)).emit('dialogs:update', userDialogData); // $FIXME (dialog:update)
    io.to(String(partnerDialogData.userId)).emit('dialogs:update', partnerDialogData); // $FIXME (dialog:update)
  });

  socket.on('messages:add', async (msg) => {
    const { userId } = socket;
    const { message, chatId } = msg;

    const { messageData, userDialogData, partnerDialogData } = await messageService.send({
      message,
      chatId,
      userId,
    });

    io.to(`user-${String(userDialogData.userId)}`).emit('dialogs:update', userDialogData); // $FIXME (dialog:update)
    io.to(`user-${String(partnerDialogData.userId)}`).emit('dialogs:update', partnerDialogData); // $FIXME (dialog:update)
    io.to(`dialog-${String(userDialogData.id)}`).emit('messages:add', messageData); // $FIXME (dialog:update)
    io.to(`dialog-${String(partnerDialogData.id)}`).emit('messages:add', messageData); // $FIXME (dialog:update)
  });
};
