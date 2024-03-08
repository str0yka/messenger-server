import { prisma } from '../prisma';

class MessageService {
  async send({
    user,
    chat,
    message,
  }: {
    user: { id: number };
    chat: { id: number };
    message: Pick<Message, 'message' | 'createdAt'>;
  }) {
    const chatData = await prisma.chat.findUniqueOrThrow({
      where: {
        id: chat.id,
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
        userId: user.id,
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
    message,
    dialog,
    deleteForEveryone = false,
  }: {
    message: { id: number };
    dialog: { id: number };
    deleteForEveryone?: boolean;
  }) {
    let messageData;
    if (deleteForEveryone) {
      messageData = await prisma.message.delete({
        where: {
          id: message.id,
        },
      });
    } else {
      messageData = await prisma.message.update({
        where: {
          id: message.id,
        },
        data: {
          dialogs: {
            disconnect: {
              id: dialog.id,
            },
          },
        },
      });
    }

    return messageData;
  }

  async read({ message }: { message: { id: number } }) {
    const messageData = await prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        read: true,
      },
    });

    return messageData;
  }

  async get({
    dialog,
    filter,
  }: {
    dialog: { id: number };
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
        id: dialog.id,
      },
      select: {
        messages: true,
        ...(filter && { messages: filter }),
      },
    });

    return messages;
  }

  async getByDate({
    dialog,
    take,
    timestamp,
  }: {
    dialog: { id: number };
    timestamp: number;
    take: number;
  }) {
    const date = new Date(timestamp);

    const { messages: afterMessages } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialog.id,
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
        id: dialog.id,
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

  async findFirstUnreadMessage({ user, dialog }: { user: { id: number }; dialog: { id: number } }) {
    const messageData = await prisma.message.findFirst({
      where: {
        dialogs: {
          some: {
            id: dialog.id,
          },
        },
        read: false,
        userId: {
          not: user.id,
        },
      },
    });

    return messageData;
  }

  async getByMessage({
    dialog,
    message,
    limit = 40,
  }: {
    dialog: { id: number };
    message: { id: number };
    limit?: number;
  }) {
    let messagesData = await this.get({
      dialog,
      filter: {
        orderBy: { createdAt: 'desc' },
        cursor: { id: message.id },
        take: -limit / 2,
      },
    });

    if (messagesData.length < limit) {
      const otherMessagesData = await this.get({
        dialog,
        filter: {
          orderBy: { createdAt: 'desc' },
          cursor: { id: message.id },
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
