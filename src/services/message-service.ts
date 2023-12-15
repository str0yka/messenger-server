import { ApiError } from '../exceptions/index.js';
import { prisma } from '../prisma/index.js';

class MessageService {
  async send(message: string, fromId: User['id'], toId: User['id']) {
    let dialogData = await prisma.dialog.findFirst({
      where: {
        AND: [
          {
            users: {
              some: {
                id: fromId,
              },
            },
          },
          {
            users: {
              some: {
                id: toId,
              },
            },
          },
        ],
      },
    });

    if (!dialogData) {
      dialogData = await prisma.dialog.create({
        data: {
          users: {
            connect: [
              {
                id: fromId,
              },
              {
                id: toId,
              },
            ],
          },
        },
      });
    }

    if (!dialogData) {
      throw ApiError.BadRequest('Error when creating dialog');
    }

    return prisma.dialog.update({
      where: {
        id: dialogData.id,
      },
      data: {
        messages: {
          create: {
            message,
            userId: fromId,
          },
        },
      },
      include: {
        messages: true,
        users: true,
      },
    });
  }
}

export const messageService = new MessageService();
