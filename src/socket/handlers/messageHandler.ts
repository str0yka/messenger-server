import { messageService } from '../../services';

export const messageHandler = (io: IO.Server, socket: IO.Socket) => {
  socket.on('message:add', async (msg) => {
    const { toId, message } = msg;

    const { userId: fromId } = socket;

    const dialogData = await messageService.send(message, Number(fromId), toId);

    console.log(fromId, toId);

    io.to(String(fromId)).emit('dialogs:update', dialogData); // $FIXME (dialog:update)
    io.to(String(toId)).emit('dialogs:update', dialogData); // $FIXME (dialog:update)
  });
};
