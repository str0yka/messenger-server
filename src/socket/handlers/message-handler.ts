import { dialogService, messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:MESSAGE_READ', async ({ readMessage }) => {
    if (!socket.data.dialog) return;

    const messageData = await messageService.read({
      message: readMessage,
    });

    const dialogData = await dialogService.get({
      dialog: socket.data.dialog,
      user: socket.data.user,
    });

    socket.emit('SERVER:MESSAGE_READ_RESPONSE', {
      unreadedMessagesCount: dialogData.unreadedMessagesCount,
    });
    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_READ', {
      message: messageData,
    });
    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
  });

  socket.on('CLIENT:MESSAGE_ADD', async ({ message }) => {
    if (!socket.data.dialog) return;

    const messageData = await messageService.send({
      message: {
        message: message.message,
        createdAt: new Date(message.createdAt),
      },
      user: socket.data.user,
      chat: { id: socket.data.dialog.chatId },
    });

    const dialogsInChat = await dialogService.getDialogsInChat({
      chat: { id: socket.data.dialog.chatId },
    });

    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_ADD', { message: messageData });
    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
    io.to(dialogsInChat.map((dialog) => `user-${dialog.userId}`)).emit(
      'SERVER:DIALOGS_NEED_TO_UPDATE',
    );
  });

  socket.on('CLIENT:MESSAGE_DELETE', async ({ messageId, deleteForEveryone }) => {
    if (!socket.data.dialog) return;

    const messageData = await messageService.delete({
      dialog: socket.data.dialog,
      message: { id: messageId },
      deleteForEveryone,
    });

    const dialogsInChat = await dialogService.getDialogsInChat({
      chat: { id: socket.data.dialog.chatId },
    });

    if (deleteForEveryone) {
      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_DELETE', {
        message: messageData,
      });
      io.to(dialogsInChat.map((dialog) => `user-${dialog.userId}`)).emit(
        'SERVER:DIALOGS_NEED_TO_UPDATE',
      );
    } else {
      socket.emit('SERVER:DIALOG_NEED_TO_UPDATE');
      socket.emit('SERVER:DIALOGS_NEED_TO_UPDATE');
      socket.emit('SERVER:MESSAGE_DELETE', { message: messageData });
    }
  });

  socket.on('CLIENT:MESSAGES_GET', async ({ filter, method = 'PATCH' }) => {
    if (!socket.data.dialog) return;

    const messages = await messageService.get({ dialog: socket.data.dialog, filter });

    io.to(`user-${socket.data.user.id}`).emit(`SERVER:MESSAGES_${method}`, { messages });
  });

  socket.on('CLIENT:JUMP_TO_DATE', async ({ timestamp, take }) => {
    if (!socket.data.dialog) return;

    const { messages, firstFoundMessage } = await messageService.getByDate({
      dialog: socket.data.dialog,
      take,
      timestamp,
    });

    io.to(`user-${socket.data.user.id}`).emit(`SERVER:JUMP_TO_DATE_RESPONSE`, {
      messages,
      firstFoundMessage,
    });
  });
};
