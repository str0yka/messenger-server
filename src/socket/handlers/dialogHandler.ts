import { dialogService } from '../../services';

export const dialogHandler = (io: IO.Server, socket: IO.Socket) => {
  const { id: userId, email: userEmail } = socket.data;

  socket.on('dialog:getOrCreate', async (partnerId) => {
    let dialogData = await dialogService.get(userId, partnerId).catch(() => null);

    if (dialogData) {
      socket.join(`chat-${dialogData.chatId}`);
      socket.emit('dialog:put', dialogData);
      return;
    }

    dialogData = await dialogService.create({ userId, userEmail, partnerId });

    socket.join(`chat-${dialogData.chatId}`);
    socket.emit('dialog:put', dialogData);
  });

  socket.on('dialogs:get', async () => {
    const dialogs = await dialogService.getAll(userId);

    socket.emit('dialogs:put', dialogs);
  });
};
