import { userService } from '../services';

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

  const user = {
    id: Number(id),
    email: email,
    isVerified: true,
  };

  socket.data.user = user;

  socket.join(`user-${id}`);

  messageHandler(io, socket);
  dialogHandler(io, socket);

  await userService.update({ id: user.id, status: 'ONLINE' });
  const usersWithWhomThereIsADialog = await userService.getAllUsersWithWhomThereIsADialog({
    userId: user.id,
  });
  io.to(
    usersWithWhomThereIsADialog.map(
      (userWithWhomThereIsADialog) => `user-${userWithWhomThereIsADialog.id}`,
    ),
  ).emit('SERVER:DIALOGS_NEED_TO_UPDATE');

  socket.on('disconnect', async () => {
    await userService.update({ id: user.id, status: 'OFFLINE' });
    const usersWithWhomThereIsADialog = await userService.getAllUsersWithWhomThereIsADialog({
      userId: user.id,
    });
    io.to(
      usersWithWhomThereIsADialog.map(
        (userWithWhomThereIsADialog) => `user-${userWithWhomThereIsADialog.id}`,
      ),
    ).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
  });
};
