type UserDto = Omit<User, 'password'>;

type DialogDto = Dialog & {
  user: UserDto;
  partner: UserDto;
  lastMessage: MessageDto | null;
  unreadedMessagesCount: number;
  pinnedMessage: MessageDto | null;
};

type MessageDto = MessageItem & {
  user: UserDto;
  message: Message & {
    user: UserDto;
    replyMessage:
      | (MessageItem & {
          user: UserDto;
          message: Message & { user: UserDto };
        })
      | null;
  };
};
