import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:DIALOG_JOIN', async ({ partner, messagesLimit }) => {
    const { dialog, messages } = await dialogService.join({
      user: { id: socket.data.user.id, email: socket.data.user.email },
      partner,
      messagesLimit,
    });

    if (socket.data.dialog) {
      socket.leave(`chat-${socket.data.dialog.chatId}`);
    }

    socket.data.dialog = dialog;
    socket.join(`chat-${dialog.chatId}`);

    socket.emit('SERVER:DIALOG_JOIN_RESPONSE', {
      dialog,
      messages,
    });
  });

  socket.on('CLIENT:DIALOG_GET', async () => {
    if (!socket.data.dialog) return;

    const dialogData = await dialogService.get({
      id: socket.data.dialog.id,
      userId: socket.data.user.id,
    });

    socket.emit('SERVER:DIALOG_GET_RESPONSE', { dialog: dialogData });
  });

  socket.on('CLIENT:DIALOGS_GET', async () => {
    const dialogs = await dialogService.getAll({ userId: socket.data.user.id });

    socket.emit('SERVER:DIALOGS_PUT', { dialogs });
  });

  socket.on('CLIENT:UPDATE_DIALOG_STATUS', async ({ status }) => {
    if (!socket.data.dialog) return;

    const partnerDialogData = await dialogService.get({
      userId: socket.data.dialog.partnerId,
      partnerId: socket.data.user.id,
    });

    await dialogService.update({
      userId: socket.data.dialog.partnerId,
      dialog: { id: partnerDialogData.id, status },
    });

    io.to(`chat-${partnerDialogData.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
  });
};
