import { prisma } from '../prisma';

class MessageService {
  async send({
    userId,
    chatId,
    message,
  }: {
    userId: number;
    chatId: number;
    message: Pick<Message, 'message' | 'createdAt'>;
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
        ...message,
        userId: userId,
        dialogs: {
          connect: chatData.dialogs.map((dialogData) => ({
            id: dialogData.id,
          })),
        },
      },
    });

    return messageData;
  }

  async delete({
    messageId,
    dialogId,
    deleteForEveryone = false,
  }: {
    messageId: number;
    dialogId: number;
    deleteForEveryone?: boolean;
  }) {
    let messageData;
    if (deleteForEveryone) {
      messageData = await prisma.message.delete({
        where: {
          id: messageId,
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
      });
    }

    return messageData;
  }

  async read({ messageId }: { messageId: number }) {
    return prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        read: true,
      },
    });
  }

  async get({
    dialogId,
    filter,
  }: {
    dialogId: number;
    filter?: {
      orderBy?: {
        createdAt?: 'desc' | 'asc';
      };
      take?: number;
      cursor?: {
        id: number;
      };
      skip?: number;
    };
  }) {
    const { messages } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialogId,
      },
      select: {
        messages: true,
        ...(filter && { messages: filter }),
      },
    });

    return messages;
  }

  async getByDate({
    dialogId,
    take,
    timestamp,
  }: {
    dialogId: number;
    timestamp: number;
    take: number;
  }) {
    const date = new Date(timestamp);

    const { messages: afterMessages } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialogId,
      },
      select: {
        messages: {
          where: {
            createdAt: {
              gte: date,
            },
          },
          take: take / 2,
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const { messages: beforeMessages } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialogId,
      },
      select: {
        messages: {
          where: {
            createdAt: {
              lt: date,
            },
          },
          take: take / 2,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const firstFoundMessage = afterMessages.at(0) ?? beforeMessages.at(0);

    return { firstFoundMessage, messages: [...afterMessages.reverse(), ...beforeMessages] };
  }

  async findFirstUnreadMessage({ userId, dialogId }: { userId: number; dialogId: number }) {
    return prisma.message.findFirst({
      where: {
        dialogs: {
          some: {
            id: dialogId,
          },
        },
        read: false,
        userId: {
          not: userId,
        },
      },
    });
  }

  async getByMessage({
    dialogId,
    messageId,
    limit = 40,
  }: {
    dialogId: number;
    messageId: number;
    limit?: number;
  }) {
    let messagesData = await this.get({
      dialogId,
      filter: {
        orderBy: { createdAt: 'desc' },
        cursor: { id: messageId },
        take: -limit / 2,
      },
    });

    if (messagesData.length < limit) {
      const otherMessagesData = await this.get({
        dialogId,
        filter: {
          orderBy: { createdAt: 'desc' },
          cursor: { id: messageId },
          take: limit - messagesData.length,
          skip: 1,
        },
      });

      messagesData = [...messagesData, ...otherMessagesData];
    }

    return messagesData;
  }
}

export const messageService = new MessageService();
