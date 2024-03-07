import { ApiError } from '../exceptions';
import { prisma } from '../prisma';

import { messageService } from './message-service';
import { userService } from './user-service';

class DialogService {
  async get(
    params:
      | { userId: User['id']; partner: { id: User['id'] } | { username: User['username'] } }
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
            status: true,
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
            status: true,
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
            status: true,
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
            status: true,
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

    return dialogsData
      .map((dialogData) => {
        const {
          messages,
          _count: { messages: unreadedMessagesCount },
          ...dialog
        } = dialogData;

        return { dialog, lastMessage: messages[0], unreadedMessagesCount };
      })
      .sort(
        (firstDialog, secondDialog) =>
          secondDialog.lastMessage.createdAt.valueOf() -
          firstDialog.lastMessage.createdAt.valueOf(),
      );
  }

  async create({
    user,
    partner,
  }: {
    user: Pick<User, 'id' | 'email'>;
    partner: { id: number } | { username: string };
  }) {
    const partnerData = await userService.get(partner);

    if (!partnerData) {
      throw ApiError.BadRequest(`User isn't exist`);
    }

    await prisma.chat.create({
      data: {
        users: {
          connect: [user, partner],
        },
        dialogs: {
          createMany: {
            data: [
              {
                title: partnerData.email,
                userId: user.id,
                partnerId: partnerData.id,
              },
              {
                title: user.email,
                userId: partnerData.id,
                partnerId: user.id,
              },
            ],
          },
        },
      },
      include: {
        dialogs: true,
      },
    });

    return this.get({ userId: user.id, partner });
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
    partner,
    messagesLimit = 40,
  }: {
    user: Pick<UserDto, 'id' | 'email'>;
    partner: { id: number } | { username: string };
    messagesLimit?: number;
  }) {
    let dialogData = await dialogService.get({ userId: user.id, partner }).catch(() => null);

    if (!dialogData) {
      dialogData = await dialogService.create({
        user,
        partner,
      });
    }

    const { dialog, lastMessage, unreadedMessagesCount } = dialogData;

    const firstUnreadMessageData = await messageService.findFirstUnreadMessage({
      dialogId: dialog.id,
      userId: user.id,
    });

    let messagesData;
    if (firstUnreadMessageData) {
      messagesData = await messageService.getByMessage({
        dialogId: dialog.id,
        message: firstUnreadMessageData,
        limit: messagesLimit,
      });
    } else {
      messagesData = await messageService.get({
        dialogId: dialog.id,
        filter: { orderBy: { createdAt: 'desc' }, take: messagesLimit },
      });
    }

    return { dialog, lastMessage, unreadedMessagesCount, messages: messagesData };
  }

  async updatePartnerDialogStatus({
    userId,
    partnerId,
    status,
  }: {
    userId: User['id'];
    partnerId: User['id'];
    status: Dialog['status'];
  }) {
    const partnerDialogData = await this.get({ userId: partnerId, partnerId: userId });
    return prisma.dialog.update({ where: { id: partnerDialogData.dialog.id }, data: { status } });
  }
}

export const dialogService = new DialogService();
