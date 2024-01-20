import { messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  const { id: userId } = socket.data;

  socket.on('message:read', async (messageId) => {
    const { dialogs, ...messageData } = await messageService.read(messageId);

    const chatId = dialogs[0].chatId;

    io.to(`chat-${chatId}`).emit('message:patch', messageData);
    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('dialogs:updateRequired');
  });

  socket.on('messages:add', async (chatId, message) => {
    const { dialogs, ...messageData } = await messageService.send({
      message,
      chatId,
      userId,
    });

    io.to(`chat-${chatId}`).emit('messages:add', messageData);
    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('dialogs:updateRequired');
  });

  socket.on('message:delete', async (messageId, dialogId, deleteForEveryone = false) => {
    const { dialogs, ...messageData } = await messageService.delete(
      messageId,
      dialogId,
      deleteForEveryone,
    );

    const chatId = dialogs[0].chatId;

    io.to(`chat-${chatId}`).emit('message:delete', messageData);
    io.to(`user-${userId}`).emit('dialogs:updateRequired');
    io.to(
      dialogs.filter((dialog) => dialog.userId !== userId).map((dialog) => `user-${dialog.userId}`),
    ).emit('dialogs:updateRequired');
  });
};
