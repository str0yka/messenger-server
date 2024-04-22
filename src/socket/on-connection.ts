import { dialogService, userService } from '../services';

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

  try {
    await userService.update({ id: user.id, status: 'ONLINE' });
    const dialogsInWhichTheUserIsAMember = await dialogService.getDialogsInWhichTheUserIsAMember({
      userId: user.id,
    });
    io.to(
      dialogsInWhichTheUserIsAMember.map(
        (dialogInWhichTheUserIsAMember) => `user-${dialogInWhichTheUserIsAMember.userId}`,
      ),
    ).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
    io.to(
      dialogsInWhichTheUserIsAMember.map(
        (dialogInWhichTheUserIsAMember) => `chat-${dialogInWhichTheUserIsAMember.chatId}`,
      ),
    ).emit('SERVER:DIALOG_NEED_TO_UPDATE');
  } catch (e) {
    console.log('connect', e);
  }

  socket.on('disconnect', async () => {
    try {
      await userService.update({ id: user.id, status: 'OFFLINE' });
      const dialogsInWhichTheUserIsAMember = await dialogService.getDialogsInWhichTheUserIsAMember({
        userId: user.id,
      });
      io.to(
        dialogsInWhichTheUserIsAMember.map(
          (dialogInWhichTheUserIsAMember) => `user-${dialogInWhichTheUserIsAMember.userId}`,
        ),
      ).emit('SERVER:DIALOGS_NEED_TO_UPDATE');
      io.to(
        dialogsInWhichTheUserIsAMember.map(
          (dialogInWhichTheUserIsAMember) => `chat-${dialogInWhichTheUserIsAMember.chatId}`,
        ),
      ).emit('SERVER:DIALOG_NEED_TO_UPDATE');
    } catch (e) {
      console.log('disconnect', e);
    }
  });
};
