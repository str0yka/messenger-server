import { prisma } from '../../prisma';
import { messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:MESSAGE_READ', async ({ readMessage }) => {
    if (!socket.data.dialog) return;

    const messageData = await prisma.message.update({
      where: {
        id: readMessage.id,
      },
      data: {
        read: true,
      },
    });

    const {
      _count: { messages: unreadedMessagesCount },
    } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: socket.data.dialog.id,
      },
      select: {
        _count: {
          select: {
            messages: {
              where: {
                id: {
                  not: socket.data.user.id,
                },
                read: false,
              },
            },
          },
        },
      },
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

    io.to(`chat-${socket.data.dialog.id}`).emit('SERVER:MESSAGE_DELETE', messageData);
    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
  });

  socket.on('CLIENT:MESSAGES_GET', async ({ filter, method = 'patch' }) => {
    if (!socket.data.dialog) return;

    const messages = await messageService.get(socket.data.dialog.id, filter);

    if (method === 'patch') {
      return io.to(`user-${socket.data.user.id}`).emit('SERVER:MESSAGES_PATCH', messages);
    }

    io.to(`user-${socket.data.user.id}`).emit('SERVER:MESSAGES_PUT', messages);
  });
};
