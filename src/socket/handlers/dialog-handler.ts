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

  socket.on('CLIENT:DIALOG_LEAVE', () => {
    socket.leave(`chat-${socket.data.dialog?.chatId}`);
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

  socket.on('CLIENT:DIALOG_DELETE', async ({ dialogId, deleteForEveryone = false }) => {
    try {
      const dialogData = await prisma.dialog.delete({ where: { id: dialogId } });

      if (deleteForEveryone) {
        await prisma.dialog.deleteMany({ where: { chatId: dialogData.chatId } });
        return io
          .to([`user-${dialogData.partnerId}`, `user-${dialogData.userId}`])
          .emit('SERVER:DIALOGS_NEED_TO_UPDATE');
      }

      socket.emit('SERVER:DIALOGS_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_DELETE',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOG_BLOCK', async ({ partnerId }) => {
    try {
      const dialogData = await dialogService.get({ partnerId, userId: socket.data.user.id });

      const chatData = await prisma.chat.update({
        where: { id: dialogData.chatId },
        data: { blocked: { connect: { id: partnerId } } },
      });

      io.to(`chat-${chatData.id}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_BLOCK',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:DIALOG_UNBLOCK', async ({ partnerId }) => {
    try {
      const dialogData = await dialogService.get({ partnerId, userId: socket.data.user.id });

      const chatData = await prisma.chat.update({
        where: { id: dialogData.chatId },
        data: { blocked: { disconnect: { id: partnerId } } },
      });

      io.to(`chat-${chatData.id}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:DIALOG_UNBLOCK',
        reason: 'Unexpected error',
      });
    }
  });
};
