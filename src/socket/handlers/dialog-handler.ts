import { prisma } from '../../prisma';
import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:DIALOG_JOIN', async ({ partner, messagesLimit }) => {
    try {
      const { dialog, messages } = await dialogService.join({
        user: { id: socket.data.user.id, email: socket.data.user.email },
        partner,
        messagesLimit,
      });

      if (socket.data.dialog) {
        socket.leave(`chat-${socket.data.dialog.chatId}`);
      }

      socket.data.dialog = dialog;
      socket.join(`chat-${dialog.chatId}`);

      socket.emit('SERVER:DIALOG_JOIN_RESPONSE', {
        dialog,
        messages,
      });
    } catch (e) {
      console.log('CLIENT:DIALOG_JOIN', e);
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_JOIN',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOG_GET', async () => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:DIALOG_GET',
          reason: 'The user is not in the dialog box',
        });
      }

      const dialogData = await dialogService.get({
        id: socket.data.dialog.id,
        userId: socket.data.user.id,
      });

      socket.emit('SERVER:DIALOG_GET_RESPONSE', { dialog: dialogData });
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_GET',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOGS_GET', async () => {
    try {
      const dialogs = await dialogService.getAll({ userId: socket.data.user.id });
      socket.emit('SERVER:DIALOGS_PUT', { dialogs });
    } catch (e) {
      console.log(e);
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOGS_GET',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOG_UPDATE_STATUS', async ({ status }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:DIALOG_UPDATE_STATUS',
          reason: 'The user is not in the dialog box',
        });
      }

      const partnerDialogData = await dialogService.get({
        userId: socket.data.dialog.partnerId,
        partnerId: socket.data.user.id,
      });

      await dialogService.update({
        userId: socket.data.dialog.partnerId,
        dialog: { id: partnerDialogData.id, status },
      });

      io.to(`chat-${partnerDialogData.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_UPDATE_STATUS',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:MESSAGE_PIN', async ({ messageId }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:MESSAGE_PIN',
          reason: 'The user is not in the dialog box',
        });
      }

      const partnerDialogData = await dialogService.get({
        userId: socket.data.dialog.partnerId,
        partnerId: socket.data.user.id,
      });

      await prisma.dialog.updateMany({
        where: { OR: [{ id: socket.data.dialog.id }, { id: partnerDialogData.id }] },
        data: { pinnedMessageId: messageId },
      });

      io.to(`chat-${partnerDialogData.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:MESSAGE_PIN',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOG_PIN', async ({ dialogId }) => {
    try {
      await prisma.dialog.updateMany({
        where: {
          userId: socket.data.user.id,
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

      socket.emit('SERVER:DIALOGS_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_PIN',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOG_UNPIN', async ({ dialogId }) => {
    try {
      const dialogData = await prisma.dialog.findUnique({ where: { id: dialogId } });

      if (!dialogData || !dialogData.isPinned || typeof dialogData.pinnedOrder !== 'number') {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:DIALOG_UNPIN',
          reason: 'Such a dialog does not exist or it is not pinned',
        });
      }

      await prisma.dialog.updateMany({
        where: {
          userId: socket.data.user.id,
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

      socket.emit('SERVER:DIALOGS_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_UNPIN',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOG_CHANGE_PINNED_ORDER', async ({ dialogs }) => {
    try {
      await prisma.$transaction(
        dialogs.map(({ dialogId, order }) =>
          prisma.dialog.update({ where: { id: dialogId }, data: { pinnedOrder: order } }),
        ),
      );
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_CHANGE_PINNED_ORDER',
        reason: 'Unexpected error',
      });
    }
  });
};
