import { prisma } from '../../prisma';
import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:DIALOG_JOIN', async ({ partnerId }) => {
    let dialogData = await dialogService
      .get({ userId: socket.data.user.id, partnerId })
      .catch(() => null);

    if (!dialogData) {
      dialogData = await dialogService.create({
        userId: socket.data.user.id,
        userEmail: socket.data.user.email,
        partnerId,
      });
    }

    const { dialog, lastMessage, unreadedMessagesCount } = dialogData;

    const firstUnreadMessageData = await prisma.message.findFirst({
      where: {
        dialogs: {
          some: {
            id: dialog.id,
            chatId: dialog.chatId,
          },
        },
        read: false,
        userId: {
          not: socket.data.user.id,
        },
      },
    });

    let messagesData;
    if (firstUnreadMessageData) {
      messagesData = await prisma.message.findMany({
        where: {
          dialogs: {
            some: {
              id: dialog.id,
              chatId: dialog.chatId,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: -40,
        cursor: {
          id: firstUnreadMessageData.id,
        },
      });

      if (messagesData.length < 40) {
        const otherMessagesData = await prisma.message.findMany({
          where: {
            dialogs: {
              some: {
                id: dialog.id,
                chatId: dialog.chatId,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 40 - messagesData.length,
          cursor: {
            id: firstUnreadMessageData.id,
          },
          skip: 1,
        });

        messagesData = [...messagesData, ...otherMessagesData];
      }
    } else {
      messagesData = await prisma.message.findMany({
        where: {
          dialogs: {
            some: {
              id: dialog.id,
              chatId: dialog.chatId,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 40,
      });
    }

    if (socket.data.dialog) {
      socket.leave(`chat-${socket.data.dialog.chatId}`);
    }

    socket.data.dialog = dialog;
    socket.join(`chat-${dialog.chatId}`);
    socket.emit('SERVER:DIALOG_JOIN_RESPONSE', {
      dialog,
      unreadedMessagesCount,
      messages: messagesData,
      lastMessage,
    });
  });

  socket.on('CLIENT:DIALOG_GET', async () => {
    if (!socket.data.dialog) return;

    const dialogData = await dialogService
      .get({ id: socket.data.dialog.id, userId: socket.data.user.id })
      .catch(() => null);

    if (!dialogData) {
      throw new Error(); // $FIXME
    }

    socket.emit('SERVER:DIALOG_GET_RESPONSE', dialogData);
  });

  socket.on('CLIENT:DIALOGS_GET', async () => {
    const dialogs = await dialogService.getAll(socket.data.user.id);

    socket.emit('SERVER:DIALOGS_PUT', { dialogs });
  });
};
