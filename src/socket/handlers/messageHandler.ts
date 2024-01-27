import { messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('messages:read', async ({ lastReadMessageId }) => {
    if (!socket.data.dialog) return;

    await messageService.read({
      lastReadMessageId,
      userId: socket.data.user.id,
      chatId: socket.data.dialog.chatId,
    });

    io.to(`chat-${socket.data.dialog.chatId}`).emit('messages:read', lastReadMessageId);
    io.to(`chat-${socket.data.dialog.chatId}`).emit('dialog:updateRequired');
    io.to([`user-${socket.data.dialog.userId}`, `user-${socket.data.dialog.partnerId}`]).emit(
      'dialogs:updateRequired',
    );
  });

  socket.on('message:add', async (message) => {
    if (!socket.data.dialog) return;

    const { dialogs, ...messageData } = await messageService.send({
      message: {
        ...message,
        createdAt: new Date(message.createdAt),
      },
      userId: socket.data.user.id,
      chatId: socket.data.dialog.chatId,
    });

    io.to(`chat-${socket.data.dialog.chatId}`).emit('message:add', messageData);
    io.to(`chat-${socket.data.dialog.chatId}`).emit('dialog:updateRequired');
    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('dialogs:updateRequired');
  });

  socket.on('message:delete', async ({ messageId, deleteForEveryone = false }) => {
    if (!socket.data.dialog) return;

    const { dialogs, ...messageData } = await messageService.delete(
      messageId,
      socket.data.dialog.id,
      deleteForEveryone,
    );

    io.to(`chat-${socket.data.dialog.id}`).emit('message:delete', messageData);
    io.to(`user-${socket.data.user.id}`).emit('dialogs:updateRequired');
    io.to(
      dialogs
        .filter((dialog) => dialog.userId !== socket.data.user.id)
        .map((dialog) => `user-${dialog.userId}`),
    ).emit('dialogs:updateRequired');
  });

  socket.on('messages:get', async ({ filter, method = 'patch' }) => {
    if (!socket.data.dialog) return;

    const messages = await messageService.get(socket.data.dialog.id, filter);

    if (method === 'patch') {
      return io.to(`user-${socket.data.user.id}`).emit('messages:patch', messages);
    }

    io.to(`user-${socket.data.user.id}`).emit('messages:put', messages);
  });
};
