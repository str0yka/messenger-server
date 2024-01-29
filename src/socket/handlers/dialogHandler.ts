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

    const { dialog, unreadedMessagesCount } = dialogData;

    const firstUnreadMessageData = await prisma.message.findFirst({
      where: {
        dialogs: {
          every: {
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
            every: {
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
              every: {
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
            every: {
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

    socket.data.dialog = dialog;
    socket.join(`chat-${dialog.chatId}`);
    socket.emit('SERVER:GET_DIALOG_RESPONSE', {
      dialog,
      unreadedMessagesCount,
      messages: messagesData,
    });
  });

  socket.on('CLIENT:DIALOG_GET', async () => {
    if (!socket.data.dialog) return;

    const dialogData = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: socket.data.dialog.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
        partner: {
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
      },
    });

    socket.emit('SERVER:DIALOG_PUT', { dialog: dialogData });
  });

  socket.on('CLIENT:DIALOGS_GET', async () => {
    const dialogs = await dialogService.getAll(socket.data.user.id);

    socket.emit('SERVER:DIALOGS_PUT', { dialogs });
  });
};
