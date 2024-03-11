import { prisma } from '../prisma';

class MessageService {
  async send({
    userId,
    chatId,
    message,
  }: {
    userId: number;
    chatId: number;
    message: Pick<MessageDto, 'message'> &
      Partial<Pick<MessageDto, 'createdAt' | 'replyMessageId'>>;
  }): Promise<MessageDto> {
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
      include: {
        replies: true,
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
  }): Promise<MessageDto> {
    let messageData;
    if (deleteForEveryone) {
      messageData = await prisma.message.delete({
        where: {
          id: messageId,
        },
        include: {
          replies: true,
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
          replies: true,
        },
      });
    }

    return messageData;
  }

  async read({ messageId }: { messageId: number }): Promise<MessageDto> {
    return prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        read: true,
      },
      include: {
        replies: true,
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
  }): Promise<MessageDto[]> {
    const { messages } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialogId,
      },
      select: {
        messages: { include: { replies: true } },
        ...(filter && { messages: { ...filter, include: { replies: true } } }),
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
  }): Promise<{ messages: MessageDto[]; firstFoundMessage?: MessageDto }> {
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
          include: { replies: true },
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
          include: { replies: true },
        },
      },
    });

    const firstFoundMessage = afterMessages.at(0) ?? beforeMessages.at(0);

    return { firstFoundMessage, messages: [...afterMessages.reverse(), ...beforeMessages] };
  }

  async findFirstUnreadMessage({
    userId,
    dialogId,
  }: {
    userId: number;
    dialogId: number;
  }): Promise<MessageDto | null> {
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
      include: { replies: true },
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
  }): Promise<MessageDto[]> {
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
