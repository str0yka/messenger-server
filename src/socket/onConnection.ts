import { dialogService } from '../services/dialog-service.js';

import { messageHandler } from './handlers/index.js';

export const onConnection = async (io: IO.Server, socket: IO.Socket) => {
  const { id, email, isVerified } = socket.handshake.query;

  if (!id || !email || !isVerified) {
    return; // $FIXME
  }

  socket.userId = id;
  socket.email = email;
  socket.isVerified = isVerified;

  socket.join(id);

  const dialogs = await dialogService.getAll(Number(id));

  socket.emit('dialogs:put', dialogs);

  messageHandler(io, socket);
};
