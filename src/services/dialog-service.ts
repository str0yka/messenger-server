import { DialogDto } from '../dtos';
import { ApiError } from '../exceptions';
import { prisma } from '../prisma';
import { PRISMA_SELECT } from '../utils/constants';

import { messageService } from './message-service';
import { userService } from './user-service';

class DialogService {
  async get(
    dialog: {
      userId: number;
    } & (
      | { id: number }
      | { partnerId: number }
      | { partner: { username: string } | { id: number } }
    ),
  ): Promise<DialogDto> {
    const dialogData = await prisma.dialog.findFirstOrThrow({
      where: {
        userId: dialog.userId,
        ...('id' in dialog && { id: dialog.id }),
        ...('partnerId' in dialog && { partnerId: dialog.partnerId }),
        ...('partner' in dialog && {
          partner: {
            ...('id' in dialog.partner && { id: dialog.partner.id }),
            ...('username' in dialog.partner && { username: dialog.partner.username }),
          },
        }),
      },
      include: {
        user: {
          select: PRISMA_SELECT.USER,
        },
        partner: {
          select: PRISMA_SELECT.USER,
        },
        pinnedMessage: {
          select: PRISMA_SELECT.MESSAGE,
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                userId: {
                  not: dialog.userId,
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
          select: PRISMA_SELECT.MESSAGE,
        },
      },
    });

    const chatData = await prisma.chat.findUniqueOrThrow({
      where: { id: dialogData.chatId },
      select: { blocked: true },
    });

    const {
      messages,
      _count: { messages: unreadedMessagesCount },
      ...otherDialogData
    } = dialogData;

    return DialogDto({
      dialog: otherDialogData,
      lastMessage: messages.at(0) ?? null,
      unreadedMessagesCount,
      blocked: chatData.blocked,
    });
  }

  async getDialogsInChat({ chatId }: { chatId: number }): Promise<Dialog[]> {
    return prisma.dialog.findMany({ where: { chatId } });
  }

  async getAll({
    userId,
  }: {
    userId: number;
  }): Promise<{ pinned: DialogDto[]; unpinned: DialogDto[] }> {
    const chatsData = await prisma.chat.findMany({
      where: {
        dialogs: {
          some: {
            userId,
          },
        },
      },
      select: {
        blocked: {
          select: PRISMA_SELECT.USER,
        },
        dialogs: {
          where: {
            userId,
          },
          include: {
            user: {
              select: PRISMA_SELECT.USER,
            },
            partner: {
              select: PRISMA_SELECT.USER,
            },
            pinnedMessage: {
              select: PRISMA_SELECT.MESSAGE,
            },
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: PRISMA_SELECT.MESSAGE,
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
        },
      },
    });

    const dialogs = chatsData
      .map((chatData) => {
        const { blocked, dialogs } = chatData;
        const dialogData = dialogs[0];

        const {
          messages,
          _count: { messages: unreadedMessagesCount },
          ...dialog
        } = dialogData;

        return DialogDto({
          dialog,
          lastMessage: messages.at(0) ?? null,
          unreadedMessagesCount,
          blocked,
        });
      })
      .filter(
        (dialogData) => !!dialogData.lastMessage || dialogData.userId === dialogData.partnerId,
      );

    return {
      pinned: dialogs
        .filter((dialog) => dialog.isPinned)
        .sort((firstDialog, secondDialog) => firstDialog.pinnedOrder! - secondDialog.pinnedOrder!),
      unpinned: dialogs
        .filter((dialog) => !dialog.isPinned)
        .sort((firstDialog, secondDialog) => {
          if (firstDialog.lastMessage && secondDialog.lastMessage) {
            return (
              secondDialog.lastMessage.createdAt.valueOf() -
              firstDialog.lastMessage.createdAt.valueOf()
            );
          }
          if (!firstDialog.lastMessage) return 1;
          return -1;
        }),
    };
  }

  async create({
    user,
    partner,
  }: {
    user: { id: number; email: string };
    partner: { id: number } | { username: string };
  }): Promise<DialogDto> {
    const userData = await userService.get({ id: user.id });
    const partnerData = await userService.get(partner);

    if (!partnerData || !userData) {
      throw ApiError.BadRequest(`User isn't exist`);
    }

    const chatData = await prisma.chat.findFirst({
      where: {
        AND: [
          {
            users: {
              some: {
                id: userData.id,
              },
            },
          },
          {
            users: {
              some: {
                id: partnerData.id,
              },
            },
          },
        ],
      },
      include: {
        dialogs: true,
      },
    });

    console.log('@chatData', chatData);

    if (
      chatData &&
      !!chatData.dialogs.find(
        (dialog) => dialog.userId === userData.id && dialog.partnerId === partnerData.id,
      )
    ) {
      throw ApiError.BadRequest('Dialog already exist');
    }

    if (userData.id === partnerData.id) {
      if (!chatData) {
        await prisma.chat.create({
          data: {
            users: {
              connect: { id: user.id },
            },
            dialogs: {
              create: {
                title: 'Saved Messages',
                userId: user.id,
                partnerId: user.id,
              },
            },
          },
        });
      } else {
        await prisma.chat.update({
          where: { id: chatData.id },
          data: {
            users: {
              connect: {
                id: userData.id,
              },
            },
            dialogs: {
              create: {
                title: 'Saved Messages',
                userId: user.id,
                partnerId: user.id,
              },
            },
          },
        });
      }

      return this.get({ partnerId: partnerData.id, userId: userData.id });
    }

    if (chatData) {
      await prisma.chat.update({
        where: { id: chatData.id },
        data: {
          users: {
            connect: {
              id: userData.id,
            },
          },
          dialogs: {
            create: {
              title: partnerData.name,
              userId: userData.id,
              partnerId: partnerData.id,
            },
          },
        },
      });
    } else {
      await prisma.chat.create({
        data: {
          users: {
            connect: [{ id: userData.id }, { id: partnerData.id }],
          },
          dialogs: {
            createMany: {
              data: [
                {
                  title: partnerData.name,
                  userId: userData.id,
                  partnerId: partnerData.id,
                },
                {
                  title: userData.name,
                  userId: partnerData.id,
                  partnerId: userData.id,
                },
              ],
            },
          },
        },
      });
    }

    return this.get({ userId: userData.id, partnerId: partnerData.id });
  }

  async search({
    userId,
    search: { query, limit = 50, page = 1 },
  }: {
    userId: number;
    search: Record<string, string | number | undefined>;
  }): Promise<DialogDto[]> {
    if (!query) {
      return [];
    }

    if (typeof query !== 'string') {
      throw ApiError.BadRequest('Incorrect query type');
    }

    limit = Number(limit);
    page = Number(page);

    const chatsData = await prisma.chat.findMany({
      where: {
        dialogs: {
          some: {
            userId,
            OR: [
              { title: { contains: query } },
              { partner: { username: { contains: query } } },
              { partner: { email: { contains: query } } },
            ],
          },
        },
      },
      select: {
        blocked: {
          select: PRISMA_SELECT.USER,
        },
        dialogs: {
          where: {
            userId,
            OR: [
              { title: { contains: query } },
              { partner: { username: { contains: query } } },
              { partner: { email: { contains: query } } },
            ],
          },
          take: limit,
          skip: (page - 1) * limit,
          include: {
            user: {
              select: PRISMA_SELECT.USER,
            },
            partner: {
              select: PRISMA_SELECT.USER,
            },
            pinnedMessage: {
              select: PRISMA_SELECT.MESSAGE,
            },
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: PRISMA_SELECT.MESSAGE,
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
        },
      },
    });

    return chatsData.map((chatData) => {
      const { blocked, dialogs } = chatData;
      const dialogData = dialogs[0];

      const {
        messages,
        _count: { messages: unreadedMessagesCount },
        ...dialog
      } = dialogData;

      return DialogDto({
        dialog,
        lastMessage: messages.at(0) ?? null,
        unreadedMessagesCount,
        blocked,
      });
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
  }): Promise<{ dialog: DialogDto; messages: MessageDto[] }> {
    let dialogData;
    try {
      dialogData = await dialogService.get({
        userId: user.id,
        partner,
      });
    } catch {
      dialogData = await dialogService.create({
        user,
        partner,
      });
    }

    const firstUnreadMessageData = await messageService.findFirstUnreadMessage({
      dialogId: dialogData.id,
      userId: user.id,
    });

    let messagesData;
    if (firstUnreadMessageData) {
      const { messages } = await messageService.getByMessage({
        dialogId: dialogData.id,
        messageId: firstUnreadMessageData.id,
        limit: messagesLimit,
      });
      messagesData = messages;
    } else {
      messagesData = await messageService.get({
        dialogId: dialogData.id,
        filter: { orderBy: { createdAt: 'desc' }, take: messagesLimit },
      });
    }

    return { dialog: dialogData, messages: messagesData };
  }

  async update({
    userId,
    dialog: { id: dialogId, ...updateFields },
  }: {
    dialog: { id: number } & Partial<Pick<DialogDto, 'status' | 'title'>>;
    userId: number;
  }) {
    return prisma.dialog.update({
      where: { id: dialogId },
      data: updateFields,
      include: {
        user: {
          select: PRISMA_SELECT.USER,
        },
        partner: {
          select: PRISMA_SELECT.USER,
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
  }

  async unpin({ userId, dialogId }: { userId: number; dialogId: number }) {
    const dialogData = await prisma.dialog.findUnique({ where: { id: dialogId } });

    if (!dialogData || !dialogData.isPinned || typeof dialogData.pinnedOrder !== 'number') {
      throw ApiError.BadRequest('Such a dialog does not exist or it is not pinned');
    }

    await prisma.dialog.updateMany({
      where: {
        userId: userId,
        isPinned: true,
        pinnedOrder: {
          gt: dialogData.pinnedOrder,
        },
      },
      data: {
        pinnedOrder: {
          decrement: 1,
        },
      },
    });

    await prisma.dialog.update({
      where: { id: dialogId },
      data: { isPinned: false, pinnedOrder: null },
    });
  }

  async pin({ userId, dialogId }: { userId: number; dialogId: number }) {
    await prisma.dialog.updateMany({
      where: {
        userId: userId,
        isPinned: true,
      },
      data: {
        pinnedOrder: {
          increment: 1,
        },
      },
    });

    await prisma.dialog.update({
      where: { id: dialogId },
      data: { isPinned: true, pinnedOrder: 1 },
    });
  }

  async getDialogsInWhichTheUserIsAMember({
    userId,
  }: {
    userId: number;
  }): Promise<Omit<DialogDto, 'unreadedMessagesCount'>[]> {
    const chatsData = await prisma.chat.findMany({
      where: {
        dialogs: {
          some: {
            partnerId: userId,
          },
        },
      },
      select: {
        blocked: {
          select: PRISMA_SELECT.USER,
        },
        dialogs: {
          where: {
            partnerId: userId,
          },
          include: {
            user: {
              select: PRISMA_SELECT.USER,
            },
            partner: {
              select: PRISMA_SELECT.USER,
            },
            pinnedMessage: {
              select: PRISMA_SELECT.MESSAGE,
            },
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: PRISMA_SELECT.MESSAGE,
            },
          },
        },
      },
    });

    return chatsData.map((chatData) => {
      const { blocked, dialogs } = chatData;
      const { messages, ...dialogData } = dialogs[0];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { unreadedMessagesCount, ...dialogDto } = DialogDto({
        blocked,
        dialog: dialogData,
        lastMessage: messages[0],
        unreadedMessagesCount: 0,
      });

      return dialogDto;
    });
  }
}

export const dialogService = new DialogService();
