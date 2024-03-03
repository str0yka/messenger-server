import { messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:MESSAGE_READ', async ({ readMessage }) => {
    if (!socket.data.dialog) return;

    const { messageData, unreadedMessagesCount } = await messageService.read({
      message: readMessage,
      dialogId: socket.data.dialog.id,
      userId: socket.data.user.id,
    });

    socket.emit('SERVER:MESSAGE_READ_RESPONSE', { unreadedMessagesCount });
    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_READ', {
      readMessage: messageData,
    });
    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
  });

  socket.on('CLIENT:MESSAGE_ADD', async (message) => {
    if (!socket.data.dialog) return;

    const { dialogs, ...messageData } = await messageService.send({
      message: {
        ...message,
        createdAt: new Date(message.createdAt),
      },
      userId: socket.data.user.id,
      chatId: socket.data.dialog.chatId,
    });

    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_ADD', messageData);
    io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
  });

  socket.on('CLIENT:MESSAGE_DELETE', async ({ messageId, deleteForEveryone = false }) => {
    if (!socket.data.dialog) return;

    const { dialogs, ...messageData } = await messageService.delete(
      messageId,
      socket.data.dialog.id,
      deleteForEveryone,
    );

    if (deleteForEveryone) {
      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_DELETE', messageData);
      io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
    } else {
      socket.emit('SERVER:DIALOG_NEED_TO_UPDATE');
      socket.emit('SERVER:DIALOGS_NEED_TO_UPDATE');
      socket.emit('SERVER:MESSAGE_DELETE', messageData);
    }
  });

  socket.on('CLIENT:MESSAGES_GET', async ({ filter, method = 'PATCH' }) => {
    if (!socket.data.dialog) return;

    const messages = await messageService.get({ dialogId: socket.data.dialog.id, filter });

    io.to(`user-${socket.data.user.id}`).emit(`SERVER:MESSAGES_${method}`, messages);
  });

  socket.on('CLIENT:JUMP_TO_DATE', async ({ timestamp, take }) => {
    if (!socket.data.dialog) return;

    const messageData = await messageService.getByDate(socket.data.dialog.id, timestamp, take);

    io.to(`user-${socket.data.user.id}`).emit(`SERVER:JUMP_TO_DATE_RESPONSE`, messageData);
  });
};
