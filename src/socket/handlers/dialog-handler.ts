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
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOGS_GET',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:UPDATE_DIALOG_STATUS', async ({ status }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:UPDATE_DIALOG_STATUS',
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
        event: 'CLIENT:UPDATE_DIALOG_STATUS',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:PIN_MESSAGE', async ({ messageId }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:PIN_MESSAGE',
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
        event: 'CLIENT:PIN_MESSAGE',
        reason: 'Unexpected error',
      });
    }
  });
};
