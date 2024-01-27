import { ApiError } from '../exceptions';
import { prisma } from '../prisma';

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
          },
        },
        partner: {
          select: {
            id: true,
            email: true,
            isVerified: true,
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
      },
    });

    const {
      _count: { messages: unreadedMessagesCount },
      ...otherDialogData
    } = dialogData;

    return { ...otherDialogData, unreadedMessagesCount };
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
          },
        },
        partner: {
          select: {
            id: true,
            email: true,
            isVerified: true,
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

    return dialogsData.map((dialog) => {
      const {
        messages,
        _count: { messages: unreadedMessagesCount },
        ...dialogData
      } = dialog;

      return { ...dialogData, lastMessage: messages[0], unreadedMessagesCount };
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
          },
        },
        partner: {
          select: {
            id: true,
            email: true,
            isVerified: true,
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
}

export const dialogService = new DialogService();
