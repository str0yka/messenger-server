import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  const { id: userId, email: userEmail } = socket.data;

  socket.on('dialog:join', async (partnerId) => {
    const dialogData = await dialogService.getByPartnerId(userId, partnerId);

    socket.join(`chat-${dialogData.chatId}`);

    socket.emit('dialog:put', dialogData);
  });

  socket.on('dialogs:create', async (partnerId, partnerEmail) => {
    const { dialogs } = await dialogService.create(
      {
        userId,
        userEmail,
      },
      {
        partnerId,
        partnerEmail,
      },
    );

    io.to(dialogs.map((dialog) => `user-${dialog.userId}`)).emit('dialogs:updateRequired');
  });

  socket.on('dialogs:get', async () => {
    const dialogs = await dialogService.getAll(userId);

    socket.emit('dialogs:put', dialogs);
  });
};
