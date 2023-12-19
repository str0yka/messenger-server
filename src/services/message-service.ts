import { prisma } from '../prisma';

class MessageService {
  async send({
    userId,
    chatId,
    message,
  }: {
    userId: User['id'];
    chatId: Chat['id'];
    message: Message['message'];
  }) {
    const dialogIds = await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        dialogs: {
          updateMany: {
            where: {
              chatId,
            },
            data: {
              lastMessageId: null,
            },
          },
        },
      },
      select: {
        dialogs: {
          select: {
            id: true,
          },
        },
      },
    });

    const messageData = await prisma.message.create({
      data: {
        message,
        userId,
        dialogs: {
          connect: dialogIds.dialogs.map((dialog) => ({
            id: dialog.id,
          })),
        },
        lastMessageIn: {
          connect: dialogIds.dialogs.map((dialog) => ({
            id: dialog.id,
          })),
        },
      },
      include: {
        dialogs: true,
      },
    });

    return messageData;
  }
}

export const messageService = new MessageService();
