import { prisma } from '../prisma';
import { PRISMA_SELECT } from '../utils/constants';

class MessageService {
  async send({
    userId,
    chatId,
    message,
  }: {
    userId: number;
    chatId: number;
    message:
      | { type: 'MESSAGE'; text: string; createdAt?: Date; replyMessageId?: number }
      | { type: 'FORWARDED'; id: number };
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

    let messageItemData: MessageDto;
    if (message.type === 'FORWARDED') {
      messageItemData = await prisma.messageItem.create({
        data: {
          userId,
          messageId: message.id,
          type: 'FORWARDED',
          dialogs: {
            connect: chatData.dialogs.map((dialogData) => ({ id: dialogData.id })),
          },
        },
        select: PRISMA_SELECT.MESSAGE,
      });
    } else {
      const messageData = await prisma.message.create({
        data: {
          text: message.text,
          createdAt: message.createdAt,
          replyMessageId: message.replyMessageId,
          userId,
        },
      });

      messageItemData = await prisma.messageItem.create({
        data: {
          type: 'MESSAGE',
          createdAt: message.createdAt,
          messageId: messageData.id,
          userId,
          dialogs: {
            connect: chatData.dialogs.map((dialogData) => ({ id: dialogData.id })),
          },
        },
        select: PRISMA_SELECT.MESSAGE,
      });
    }

    return messageItemData;
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
      messageData = await prisma.messageItem.delete({
        where: {
          id: messageId,
        },
        select: PRISMA_SELECT.MESSAGE,
      });
    } else {
      messageData = await prisma.messageItem.update({
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
        select: PRISMA_SELECT.MESSAGE,
      });
    }

    return messageData;
  }

  async read({ messageId }: { messageId: number }): Promise<MessageDto> {
    return prisma.messageItem.update({
      where: {
        id: messageId,
      },
      data: {
        read: true,
      },
      select: PRISMA_SELECT.MESSAGE,
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
        messages: { ...filter, select: PRISMA_SELECT.MESSAGE },
      },
    });

    return messages;
  }

  async getByDate({
    dialogId,
    take = 40,
    timestamp,
  }: {
    dialogId: number;
    timestamp: number;
    take?: number;
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
          select: PRISMA_SELECT.MESSAGE,
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
          select: PRISMA_SELECT.MESSAGE,
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
    return prisma.messageItem.findFirst({
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
      select: PRISMA_SELECT.MESSAGE,
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
  }): Promise<{ target?: MessageDto; messages: MessageDto[] }> {
    let messagesData = await this.get({
      dialogId,
      filter: {
        orderBy: { createdAt: 'desc' },
        cursor: { id: messageId },
        take: -limit / 2,
      },
    });

    const target = messagesData.at(-1);

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

    return { target, messages: messagesData };
  }
}

export const messageService = new MessageService();
