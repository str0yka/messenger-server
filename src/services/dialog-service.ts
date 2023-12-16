import { prisma } from '../prisma/index.js';

class DialogService {
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
        firstUserDialogInChat: true,
        secondUserDialogInChat: true,
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
    const userDialogData = await prisma.dialog.create({
      data: {
        title: partnerEmail,
        userId,
        partnerId,
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
        firstUserDialogInChat: true,
        secondUserDialogInChat: true,
      },
    });

    const partnerDialogData = await prisma.dialog.create({
      data: {
        title: userEmail,
        userId: partnerId,
        partnerId: userId,
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
        firstUserDialogInChat: true,
        secondUserDialogInChat: true,
      },
    });

    const chatData = await prisma.chat.create({
      data: {
        firstUserId: userId,
        secondsUserId: partnerId,
        firstUserDialogId: userDialogData.id,
        secondUserDialogId: partnerDialogData.id,
      },
      include: {
        firstUser: {
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
        secondsUser: {
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
      },
    });

    return {
      userDialogData: {
        ...userDialogData,
        firstUserDialogInChat: chatData,
        secondUserDialogInChat: chatData,
      },
      partnerDialogData: {
        ...partnerDialogData,
        firstUserDialogInChat: chatData,
        secondUserDialogInChat: chatData,
      },
    };
  }
}

export const dialogService = new DialogService();
