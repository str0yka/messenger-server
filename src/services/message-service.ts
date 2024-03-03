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
    message,
    dialogId,
    userId,
  }: {
    message: Message;
    dialogId: Dialog['id'];
    userId: UserDto['id'];
  }) {
    const messageData = await prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        read: true,
      },
    });

    const {
      _count: { messages: unreadedMessagesCount },
    } = await prisma.dialog.findUniqueOrThrow({
      where: {
        id: dialogId,
      },
      select: {
        _count: {
          select: {
            messages: {
              where: {
                id: {
                  not: userId,
                },
                read: false,
              },
            },
          },
        },
      },
    });

    return { messageData, unreadedMessagesCount };
  }

  async get({
    dialogId,
    filter,
  }: {
    dialogId: Dialog['id'];
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

  async getByDate(dialogId: Dialog['id'], timestamp: number, take: number) {
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

    const firstFoundMessage = afterMessages.at(0) ?? beforeMessages.at(0)!;

    return { firstFoundMessage, messages: [...afterMessages.reverse(), ...beforeMessages] };
  }

  async findFirstUnreadMessage({
    userId,
    dialogId,
  }: {
    userId: User['id'];
    dialogId: Dialog['id'];
  }) {
    const firstUnreadMessageData = await prisma.message.findFirst({
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

    return firstUnreadMessageData;
  }
}

export const messageService = new MessageService();
