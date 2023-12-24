import { ApiError } from '../exceptions';
import { prisma } from '../prisma';

class DialogService {
  async get(userId: User['id'], partnerId: User['id']) {
    return prisma.dialog.findFirstOrThrow({
      where: { userId, partnerId },
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
        messages: true,
      },
    });
  }

  async getAll(userId: User['id']) {
    return prisma.dialog.findMany({
      where: {
        userId,
        lastMessageId: { not: null },
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
        lastMessage: true,
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

    return this.get(userId, partnerId);
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

    return prisma.dialog.findMany({
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
        lastMessage: true,
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
  }
}

export const dialogService = new DialogService();
