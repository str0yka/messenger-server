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
    const chatData = await prisma.chat.update({
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
        id: true,
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
          connect: chatData.dialogs.map((dialog) => ({
            id: dialog.id,
          })),
        },
        lastMessageIn: {
          connect: chatData.dialogs.map((dialog) => ({
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

  async read(messageId: Message['id']) {
    const messageData = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        read: true,
      },
      include: {
        dialogs: true,
      },
    });

    return messageData;
  }
}

export const messageService = new MessageService();
