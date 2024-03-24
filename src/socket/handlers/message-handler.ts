import { dialogService, messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('CLIENT:MESSAGE_READ', async ({ readMessage }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:MESSAGE_READ',
          reason: 'The user is not in the dialog box',
        });
      }

      const messageData = await messageService.read({
        messageId: readMessage.id,
      });

      const dialogData = await dialogService.get({
        userId: socket.data.user.id,
        id: socket.data.dialog.id,
      });

      socket.emit('SERVER:MESSAGE_READ_RESPONSE', {
        unreadedMessagesCount: dialogData.unreadedMessagesCount,
      });
      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_READ', {
        message: messageData,
      });
      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:MESSAGE_READ',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:MESSAGE_ADD', async ({ message }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:MESSAGE_ADD',
          reason: 'The user is not in the dialog box',
        });
      }

      const messageData = await messageService.send({
        message: {
          message: message.message,
          createdAt:
            typeof message.createdAt === 'number' ? new Date(message.createdAt) : undefined,
          replyMessageId:
            typeof message.replyMessageId === 'number' ? message.replyMessageId : undefined,
        },
        userId: socket.data.user.id,
        chatId: socket.data.dialog.chatId,
      });

      const dialogsInChat = await dialogService.getDialogsInChat({
        chatId: socket.data.dialog.chatId,
      });

      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_ADD', {
        message: messageData,
      });
      io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
      io.to(dialogsInChat.map((dialog) => `user-${dialog.userId}`)).emit(
        'SERVER:DIALOGS_NEED_TO_UPDATE',
      );
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:MESSAGE_ADD',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:MESSAGE_DELETE', async ({ messageId, deleteForEveryone }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:MESSAGE_DELETE',
          reason: 'The user is not in the dialog box',
        });
      }

      const messageData = await messageService.delete({
        dialogId: socket.data.dialog.id,
        messageId,
        deleteForEveryone,
      });

      const dialogsInChat = await dialogService.getDialogsInChat({
        chatId: socket.data.dialog.chatId,
      });

      if (deleteForEveryone) {
        io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:DIALOG_NEED_TO_UPDATE');
        io.to(`chat-${socket.data.dialog.chatId}`).emit('SERVER:MESSAGE_DELETE', {
          message: messageData,
        });
        io.to(dialogsInChat.map((dialog) => `user-${dialog.userId}`)).emit(
          'SERVER:DIALOGS_NEED_TO_UPDATE',
        );
      } else {
        socket.emit('SERVER:DIALOG_NEED_TO_UPDATE');
        socket.emit('SERVER:DIALOGS_NEED_TO_UPDATE');
        socket.emit('SERVER:MESSAGE_DELETE', { message: messageData });
      }
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:MESSAGE_DELETE',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:MESSAGES_GET', async ({ filter, method = 'PATCH' }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:MESSAGES_GET',
          reason: 'The user is not in the dialog box',
        });
      }

      const messages = await messageService.get({ dialogId: socket.data.dialog.id, filter });

      io.to(`user-${socket.data.user.id}`).emit(`SERVER:MESSAGES_${method}`, { messages });
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:MESSAGES_GET',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:JUMP_TO_DATE', async ({ timestamp, take }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:JUMP_TO_DATE',
          reason: 'The user is not in the dialog box',
        });
      }

      const { messages, firstFoundMessage } = await messageService.getByDate({
        dialogId: socket.data.dialog.id,
        take,
        timestamp,
      });

      socket.emit('SERVER:JUMP_TO_DATE_RESPONSE', {
        messages,
        firstFoundMessage,
      });
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:JUMP_TO_DATE',
        reason: 'Unexpected error',
      });
    }
  });

  socket.on('CLIENT:JUMP_TO_MESSAGE', async ({ messageId, take }) => {
    try {
      if (!socket.data.dialog) {
        return socket.emit('SERVER:ERROR', {
          event: 'CLIENT:JUMP_TO_MESSAGE',
          reason: 'The user is not in the dialog box',
        });
      }

      const { messages, target } = await messageService.getByMessage({
        dialogId: socket.data.dialog.id,
        messageId,
        limit: take,
      });

      socket.emit('SERVER:JUMP_TO_MESSAGE_RESPONSE', { messages, target });
    } catch (e) {
      return socket.emit('SERVER:ERROR', {
        event: 'CLIENT:JUMP_TO_MESSAGE',
        reason: 'Unexpected error',
      });
    }
  });
};
