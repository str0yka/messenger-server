import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:DIALOG_JOIN', async ({ partnerId, messagesLimit }) => {
    const { dialog, lastMessage, messages, unreadedMessagesCount } = await dialogService.join({
      partnerId,
      messagesLimit,
      user: socket.data.user,
    });

    if (socket.data.dialog) {
      socket.leave(`chat-${socket.data.dialog.chatId}`);
    }

    socket.data.dialog = dialog;
    socket.join(`chat-${dialog.chatId}`);

    socket.emit('SERVER:DIALOG_JOIN_RESPONSE', {
      dialog,
      unreadedMessagesCount,
      messages,
      lastMessage,
    });
  });

  socket.on('CLIENT:DIALOG_GET', async () => {
    if (!socket.data.dialog) return;

    const dialogData = await dialogService.get({
      id: socket.data.dialog.id,
      userId: socket.data.user.id,
    });

    socket.emit('SERVER:DIALOG_GET_RESPONSE', dialogData);
  });

  socket.on('CLIENT:DIALOGS_GET', async () => {
    const dialogs = await dialogService.getAll(socket.data.user.id);

    socket.emit('SERVER:DIALOGS_PUT', { dialogs });
  });
};
