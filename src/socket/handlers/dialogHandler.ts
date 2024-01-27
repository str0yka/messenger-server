import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('dialog:getOrCreate', async ({ partnerId }) => {
    let dialogData = await dialogService
      .get({ userId: socket.data.user.id, partnerId })
      .catch(() => null);

    if (dialogData) {
      socket.data.dialog = dialogData;
      socket.join(`chat-${dialogData.chatId}`);
      socket.emit('dialog:put', dialogData);
      return;
    }

    dialogData = await dialogService.create({
      userId: socket.data.user.id,
      userEmail: socket.data.user.email,
      partnerId,
    });

    socket.join(`chat-${dialogData.chatId}`);
    socket.emit('dialog:put', dialogData);
  });

  socket.on('dialogs:get', async () => {
    const dialogs = await dialogService.getAll(socket.data.user.id);

    socket.emit('dialogs:put', dialogs);
  });
};
