type UserDto = Omit<User, 'password'>;

type DialogDto = Dialog & {
  user: UserDto;
  partner: UserDto;
  lastMessage: MessageDto | null;
  unreadedMessagesCount: number;
  pinnedMessage: MessageDto | null;
};

type MessageDto = Message & { user: UserDto } & {
  replyMessage: (Message & { user: UserDto }) | null;
};
