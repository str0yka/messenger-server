import { prisma } from '../prisma';

class DialogService {
  async getByPartnerId(userId: User['id'], partnerId: User['id']) {
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

  async get(dialogId: Dialog['id']) {
    return prisma.dialog.findUniqueOrThrow({
      where: { id: dialogId },
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
      },
    });
  }

  async create(
    { userId, userEmail }: { userId: User['id']; userEmail: User['email'] },
    { partnerId, partnerEmail }: { partnerId: User['id']; partnerEmail: User['email'] },
  ) {
    const chatData = await prisma.chat.create({
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
                title: partnerEmail,
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

    return chatData;
  }
}

export const dialogService = new DialogService();
