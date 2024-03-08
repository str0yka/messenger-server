import { DialogDto } from '../dtos';
import { ApiError } from '../exceptions';
import { prisma } from '../prisma';
import { PRISMA_SELECT } from '../utils/constants';

import { messageService } from './message-service';
import { userService } from './user-service';

class DialogService {
  async get({
    user,
    dialog,
  }: {
    user: { id: number };
    dialog: { id: number } | { partner: { id: User['id'] } | { username: User['username'] } };
  }): Promise<DialogDto> {
    const dialogData = await prisma.dialog.findFirstOrThrow({
      where: { user, ...dialog },
      include: {
        user: {
          select: PRISMA_SELECT.USER,
        },
        partner: {
          select: PRISMA_SELECT.USER,
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                userId: {
                  not: user.id,
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

    return DialogDto({
      dialog: otherDialogData,
      lastMessage: messages.at(0) ?? null,
      unreadedMessagesCount,
    });
  }

  async getDialogsInChat({ chat }: { chat: { id: number } }): Promise<Dialog[]> {
    return prisma.dialog.findMany({ where: { chat } });
  }

  async getAll({ user }: { user: { id: number } }): Promise<DialogDto[]> {
    const dialogsData = await prisma.dialog.findMany({
      where: {
        user,
      },
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
                  not: user.id,
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

        return DialogDto({ dialog, lastMessage: messages.at(0) ?? null, unreadedMessagesCount });
      })
      .filter((dialogData) => !!dialogData.lastMessage)
      .sort(
        (firstDialog, secondDialog) =>
          secondDialog.lastMessage!.createdAt.valueOf() -
          firstDialog.lastMessage!.createdAt.valueOf(),
      );
  }

  async create({
    user,
    partner,
  }: {
    user: { id: number; email: string };
    partner: { id: number } | { username: string };
  }): Promise<DialogDto> {
    const userData = await userService.get({ user });
    const partnerData = await userService.get({ user: partner });

    if (!partnerData || !userData) {
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
      include: {
        dialogs: true,
      },
    });

    return this.get({ user, dialog: { partner: partnerData } });
  }

  async search({
    user,
    search: { query, limit, page },
  }: {
    user: { id: number };
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

    const searchData = await prisma.dialog.findMany({
      where: {
        user,
        title: { contains: query },
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
                  not: user.id,
                },
              },
            },
          },
        },
      },
    });

    return searchData.map((dialog) => {
      const {
        messages,
        _count: { messages: unreadedMessagesCount },
        ...dialogData
      } = dialog;

      return DialogDto({
        dialog: dialogData,
        lastMessage: messages.at(0) ?? null,
        unreadedMessagesCount,
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
  }): Promise<{ dialog: DialogDto; messages: Message[] }> {
    let dialogData;
    try {
      dialogData = await dialogService.get({ user, dialog: { partner } });
    } catch {
      dialogData = await dialogService.create({
        user,
        partner,
      });
    }

    const firstUnreadMessageData = await messageService.findFirstUnreadMessage({
      dialog: dialogData,
      user,
    });

    let messagesData;
    if (firstUnreadMessageData) {
      messagesData = await messageService.getByMessage({
        dialog: dialogData,
        message: firstUnreadMessageData,
        limit: messagesLimit,
      });
    } else {
      messagesData = await messageService.get({
        dialog: dialogData,
        filter: { orderBy: { createdAt: 'desc' }, take: messagesLimit },
      });
    }

    return { dialog: dialogData, messages: messagesData };
  }

  async updatePartnerDialogStatus({
    user,
    partner,
    status,
  }: {
    user: { id: number };
    partner: { id: number };
    status: Dialog['status'];
  }) {
    const partnerDialogData = await this.get({ user: partner, dialog: { partner: user } });
    return prisma.dialog.update({
      where: { id: partnerDialogData.id },
      data: { status },
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
                  not: partner.id,
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
