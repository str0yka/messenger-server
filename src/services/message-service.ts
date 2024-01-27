import { prisma } from '../prisma';

class MessageService {
  async send({
    userId,
    chatId,
    message,
  }: {
    userId: User['id'];
    chatId: Chat['id'];
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

  async read({
    chatId,
    userId,
    lastReadMessageId,
  }: {
    lastReadMessageId: Message['id'];
    chatId: Chat['id'];
    userId: User['id'];
  }) {
    const messageData = await prisma.message.updateMany({
      where: {
        id: {
          lte: lastReadMessageId,
        },
        dialogs: {
          every: {
            chatId,
          },
        },
        userId: {
          not: userId,
        },
      },
      data: {
        read: true,
      },
    });

    return messageData;
  }

  async get(
    dialogId: Dialog['id'],
    filter?: {
      orderBy?: {
        createdAt?: 'desc' | 'asc';
      };
      take?: number;
      where?: {
        id?: {
          lt?: number;
          lte?: number;
          gt?: number;
          gte?: number;
        };
        createdAt?: {
          lt?: number;
          lte?: number;
          gt?: number;
          gte?: number;
        };
      };
    },
  ) {
    const convertTimestampToDate = (value?: number) => {
      if (typeof value === 'number') {
        return new Date(value);
      }

      return value;
    };

    const convertObjTimestampToDate = (obj?: Record<string, undefined | number>) => {
      if (!obj) return obj;

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, convertTimestampToDate(value)]),
      );
    };

    const { messages } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialogId,
      },
      select: {
        messages: true,
        ...(filter && {
          messages: {
            ...filter,
            where: {
              ...filter.where,
              createdAt: convertObjTimestampToDate(filter.where?.createdAt),
            },
          },
        }),
      },
    });

    return messages;
  }
}

export const messageService = new MessageService();
