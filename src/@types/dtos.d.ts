type UserDto = Omit<User, 'password'>;

type DialogDto = Dialog & {
  user: UserDto;
  partner: UserDto;
  lastMessage: MessageDto | null;
  unreadedMessagesCount: number;
};

type MessageDto = Message & { replies: Message[] };
