import { messageHandler, dialogHandler } from './handlers';

export const onConnection = async (io: IO.Server, socket: IO.Socket) => {
  const { id, email, isVerified } = socket.handshake.query;

  if (
    !id ||
    !email ||
    !isVerified ||
    isVerified !== 'true' ||
    Array.isArray(id) ||
    Array.isArray(email) ||
    Array.isArray(isVerified)
  ) {
    return; // $FIXME
  }

  socket.data.id = Number(id);
  socket.data.email = email;
  socket.data.isVerified = true;

  socket.join(`user-${id}`);

  messageHandler(io, socket);
  dialogHandler(io, socket);
};
