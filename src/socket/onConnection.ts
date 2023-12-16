import { dialogService } from '../services/dialog-service.js';

import { messageHandler } from './handlers/index.js';

export const onConnection = async (io: IO.Server, socket: IO.Socket) => {
  const { id, email, isVerified } = socket.handshake.query;

  if (!id || !email || !isVerified) {
    return; // $FIXME
  }

  socket.userId = Number(id);
  socket.email = email;
  socket.isVerified = isVerified;

  socket.join(`user-${id}`);

  const dialogs = await dialogService.getAll(Number(id));

  socket.emit('dialogs:put', dialogs);

  messageHandler(io, socket);
};
