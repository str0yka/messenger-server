import { prisma } from '../prisma/index.js';

class DialogService {
  async getAll(userId: User['id']) {
    return prisma.dialog.findMany({
      where: {
        users: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        messages: true,
        users: {
          where: {
            id: {
              not: userId,
            },
          },
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
      },
    });
  }
}

export const dialogService = new DialogService();
