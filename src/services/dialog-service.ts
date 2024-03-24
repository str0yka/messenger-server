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

  async getDialogsInChat({ chatId }: { chatId: number }): Promise<Dialog[]> {
    return prisma.dialog.findMany({ where: { chatId } });
  }

  async getAll({ userId }: { userId: number }): Promise<DialogDto[]> {
    const dialogsData = await prisma.dialog.findMany({
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
    const userData = await userService.get({ id: user.id });
    const partnerData = await userService.get(partner);

    if (!partnerData || !userData) {
      throw ApiError.BadRequest(`User isn't exist`);
    }

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

    return this.get({ userId: userData.id, partnerId: partnerData.id });
  }

  async search({
    userId,
    search: { query, limit, page },
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

    const searchData = await prisma.dialog.findMany({
      where: {
        userId,
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
}

export const dialogService = new DialogService();
