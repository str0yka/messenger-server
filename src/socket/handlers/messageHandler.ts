import { messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  const { id: userId } = socket.data;

  socket.on('messages:add', async (chatId, message) => {
    const { dialogs, ...messageData } = await messageService.send({
      message,
      chatId,
      userId,
    });

    io.to(dialogs.map((dialog) => `dialog-${dialog.id}`)).emit('messages:add', messageData); // $FIXME (dialog:update)
    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('dialogs:updateRequired'); // $FIXME (dialog:update)
  });
};
