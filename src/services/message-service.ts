import { prisma } from '../prisma/index.js';

class MessageService {
  async send({
    userId,
    chatId,
    message,
  }: {
    userId: User['id'];
    chatId: Chat['id'];
    message: Message['message'];
  }) {
    const messageData = await prisma.message.create({
      data: {
        message,
        userId,
      },
    });

    const { firstUserDialog, secondUserDialog } = await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        firstUserDialog: {
          update: {
            lastMessageId: messageData.id,
            messages: {
              connect: {
                id: messageData.id,
              },
            },
          },
        },
        secondUserDialog: {
          update: {
            lastMessageId: messageData.id,
            messages: {
              connect: {
                id: messageData.id,
              },
            },
          },
        },
      },
      select: {
        firstUserDialog: {
          include: {
            partner: {
              select: {
                id: true,
                email: true,
                isVerified: true,
              },
            },
            lastMessage: true,
            messages: true,
            firstUserDialogInChat: true,
            secondUserDialogInChat: true,
          },
        },
        secondUserDialog: {
          include: {
            partner: {
              select: {
                id: true,
                email: true,
                isVerified: true,
              },
            },
            lastMessage: true,
            messages: true,
            firstUserDialogInChat: true,
            secondUserDialogInChat: true,
          },
        },
      },
    });

    const userDialogData = firstUserDialog?.id === userId ? firstUserDialog : secondUserDialog;
    const partnerDialogData =
      userDialogData?.id === firstUserDialog?.id ? secondUserDialog : firstUserDialog;

    return { userDialogData, partnerDialogData, messageData };
  }
}

export const messageService = new MessageService();
