export const DialogDto = ({
  dialog,
  lastMessage,
  unreadedMessagesCount,
}: {
  dialog: Dialog & { user: UserDto; partner: UserDto };
  lastMessage: MessageDto | null;
  unreadedMessagesCount: number;
}): DialogDto => ({ ...dialog, lastMessage, unreadedMessagesCount });
