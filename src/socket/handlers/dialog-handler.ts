import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:DIALOG_JOIN', async ({ partner, messagesLimit }) => {
    const { dialog, messages } = await dialogService.join({
      user: socket.data.user,
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
      dialog: socket.data.dialog,
      user: socket.data.user,
    });

    socket.emit('SERVER:DIALOG_GET_RESPONSE', { dialog: dialogData });
  });

  socket.on('CLIENT:DIALOGS_GET', async () => {
    const dialogs = await dialogService.getAll({ user: socket.data.user });

    socket.emit('SERVER:DIALOGS_PUT', { dialogs });
  });

  socket.on('CLIENT:UPDATE_DIALOG_STATUS', async ({ partnerId, status }) => {
    const partnerDialogData = await dialogService.updatePartnerDialogStatus({
      user: socket.data.user,
      partner: { id: partnerId },
      status,
    });

    io.to(`chat-${partnerDialogData.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
  });
};
