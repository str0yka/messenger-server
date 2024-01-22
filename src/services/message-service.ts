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
    const chatData = await prisma.chat.findUniqueOrThrow({
      where: {
        id: chatId,
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
      },
      include: {
        dialogs: true,
      },
    });

    return messageData;
  }

  async delete(
    messageId: Message['id'],
    dialogId: Dialog['id'],
    deleteForEveryone: boolean = false,
  ) {
    let messageData;
    if (deleteForEveryone) {
      messageData = await prisma.message.delete({
        where: {
          id: messageId,
        },
        include: {
          dialogs: true,
        },
      });
    } else {
      messageData = await prisma.message.update({
        where: {
          id: messageId,
        },
        data: {
          dialogs: {
            disconnect: {
              id: dialogId,
            },
          },
        },
        include: {
          dialogs: true,
        },
      });
    }

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

  async get(
    dialogId: Dialog['id'],
    sort?: {
      orderBy?: {
        createdAt?: 'desc' | 'asc';
      };
      take?: number;
      where?: {
        id?: {
          lt?: Message['id'];
          lte?: Message['id'];
          gt?: Message['id'];
          gte?: Message['id'];
        };
        createdAt?: {
          lt?: Message['createdAt'];
          lte?: Message['createdAt'];
          gt?: Message['createdAt'];
          gte?: Message['createdAt'];
        };
      };
    },
  ) {
    const { messages } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialogId,
      },
      select: {
        messages: true,
        ...(sort && { messages: sort }),
      },
    });

    return messages;
  }
}

export const messageService = new MessageService();
