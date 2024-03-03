import { ApiError } from '../exceptions';
import { prisma } from '../prisma';

import { messageService } from './message-service';

class DialogService {
  async get(
    params:
      | { userId: User['id']; partnerId: User['id'] }
      | { id: Dialog['id']; userId: User['id'] },
  ) {
    const dialogData = await prisma.dialog.findFirstOrThrow({
      where: params,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            bio: true,
            createdAt: true,
            lastname: true,
            name: true,
            updatedAt: true,
            username: true,
          },
        },
        partner: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            bio: true,
            createdAt: true,
            lastname: true,
            name: true,
            updatedAt: true,
            username: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                userId: {
                  not: params.userId,
                },
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    const {
      messages,
      _count: { messages: unreadedMessagesCount },
      ...otherDialogData
    } = dialogData;

    return { dialog: otherDialogData, lastMessage: messages.at(0), unreadedMessagesCount };
  }

  async getAll(userId: User['id']) {
    const dialogsData = await prisma.dialog.findMany({
      where: {
        userId,
        // take dialogs where dialog started (have 1 or more messages)
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            bio: true,
            createdAt: true,
            lastname: true,
            name: true,
            updatedAt: true,
            username: true,
          },
        },
        partner: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            bio: true,
            createdAt: true,
            lastname: true,
            name: true,
            updatedAt: true,
            username: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                userId: {
                  not: userId,
                },
              },
            },
          },
        },
      },
    });

    return dialogsData.map((dialogData) => {
      const {
        messages,
        _count: { messages: unreadedMessagesCount },
        ...dialog
      } = dialogData;

      return { dialog, lastMessage: messages[0], unreadedMessagesCount };
    });
  }

  async create({
    userId,
    userEmail,
    partnerId,
  }: {
    userId: User['id'];
    userEmail: User['email'];
    partnerId: User['id'];
  }) {
    const partnerData = await prisma.user.findUnique({
      where: {
        id: partnerId,
      },
      select: {
        id: true,
        email: true,
        isVerified: true,
        bio: true,
        createdAt: true,
        lastname: true,
        name: true,
        updatedAt: true,
        username: true,
      },
    });

    if (!partnerData) {
      throw ApiError.BadRequest(`User isn't exist`);
    }

    await prisma.chat.create({
      data: {
        users: {
          connect: [
            {
              id: userId,
            },
            {
              id: partnerId,
            },
          ],
        },
        dialogs: {
          createMany: {
            data: [
              {
                title: partnerData.email,
                userId,
                partnerId,
              },
              {
                title: userEmail,
                userId: partnerId,
                partnerId: userId,
              },
            ],
          },
        },
      },
      include: {
        dialogs: true,
      },
    });

    return this.get({ userId, partnerId });
  }

  async search(
    { query, limit = 50, page = 1 }: Record<string, string | number | undefined>,
    userId: User['id'],
  ) {
    if (!query) {
      return [];
    }

    if (typeof query !== 'string') {
      throw ApiError.BadRequest('Incorrect query type');
    }

    limit = Number(limit);
    page = Number(page);

    const searchData = await prisma.dialog.findMany({
      where: {
        userId,
        title: { contains: query },
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            bio: true,
            createdAt: true,
            lastname: true,
            name: true,
            updatedAt: true,
            username: true,
          },
        },
        partner: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            bio: true,
            createdAt: true,
            lastname: true,
            name: true,
            updatedAt: true,
            username: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                userId: {
                  not: userId,
                },
              },
            },
          },
        },
      },
    });

    return searchData.map((dialog) => {
      const { messages, ...dialogData } = dialog;

      return { ...dialogData, lastMessage: messages[0] };
    });
  }

  async join({
    user,
    partnerId,
    messagesLimit = 40,
  }: {
    user: Pick<UserDto, 'id' | 'email'>;
    partnerId: number;
    messagesLimit?: number;
  }) {
    let dialogData = await dialogService.get({ userId: user.id, partnerId }).catch(() => null);

    if (!dialogData) {
      dialogData = await dialogService.create({
        userId: user.id,
        userEmail: user.email,
        partnerId,
      });
    }

    const { dialog, lastMessage, unreadedMessagesCount } = dialogData;

    const firstUnreadMessageData = await messageService.findFirstUnreadMessage({
      dialogId: dialog.id,
      userId: user.id,
    });

    let messagesData;
    if (firstUnreadMessageData) {
      messagesData = await messageService.get({
        dialogId: dialog.id,
        filter: {
          orderBy: { createdAt: 'desc' },
          cursor: { id: firstUnreadMessageData.id },
          take: -messagesLimit,
        },
      });

      if (messagesData.length < messagesLimit) {
        const otherMessagesData = await messageService.get({
          dialogId: dialog.id,
          filter: {
            orderBy: { createdAt: 'desc' },
            cursor: { id: firstUnreadMessageData.id },
            take: messagesLimit - messagesData.length,
            skip: 1,
          },
        });

        messagesData = [...messagesData, ...otherMessagesData];
      }
    } else {
      messagesData = await messageService.get({
        dialogId: dialog.id,
        filter: { orderBy: { createdAt: 'desc' }, take: messagesLimit },
      });
    }

    return { dialog, lastMessage, unreadedMessagesCount, messages: messagesData };
  }
}

export const dialogService = new DialogService();
