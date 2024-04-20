export const DialogDto = ({
  dialog,
  lastMessage,
  unreadedMessagesCount,
  blocked,
}: {
  dialog: Dialog & { user: UserDto; partner: UserDto; pinnedMessage: MessageDto | null };
  lastMessage: MessageDto | null;
  unreadedMessagesCount: number;
  blocked: UserDto[];
}): DialogDto => {
  const userBlocked = !!blocked.find((user) => user.id === dialog.userId);
  const partnerBlocked = !!blocked.find((user) => user.id === dialog.partnerId);

  return { ...dialog, lastMessage, unreadedMessagesCount, userBlocked, partnerBlocked };
};
