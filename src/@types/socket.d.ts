interface ServerToClientEvents {
  'dialogs:put': (
    dialogs: (Dialog & {
      user: UserDto;
      partner: UserDto;
      lastMessage: Message | null;
      unreadedMessagesCount: number;
    })[],
  ) => void;
  'dialogs:updateRequired': () => void;
  'dialog:put': (
    dialog: Dialog & { user: UserDto; partner: UserDto; unreadedMessagesCount: number },
  ) => void;
  'dialog:patch': (
    dialog: Partial<Dialog & { user: UserDto; partner: UserDto; unreadedMessagesCount: number }>,
  ) => void;
  'dialog:updateRequired': () => void;
  'message:patch': (message: Pick<Message, 'id'> & Partial<Message>) => void;
  'message:add': (message: Message) => void;
  'message:delete': (message: Message) => void;
  'messages:put': (messages: Message[]) => void;
  'messages:patch': (messages: Message[]) => void;
  'messages:read': (lastReadMessageId: Message['id']) => void;
}

interface ClientToServerEvents {
  'dialog:getOrCreate': (params: { partnerId: number }) => void;
  'dialogs:get': () => void;
  'messages:read': (params: { lastReadMessageId: Message['id'] }) => void;
  'message:delete': (params: { messageId: number; deleteForEveryone?: boolean }) => void;
  'message:add': (message: { message: string; createdAt: number }) => void;
  'messages:get': (params: {
    filter?: {
      orderBy?: {
        createdAt?: 'desc' | 'asc';
      };
      take?: number;
      where?: {
        id?: {
          lt?: Message['id'];
          lte?: Message['id'];
          gt?: Message['id'];
          gte?: Message['id'];
        };
        createdAt?: {
          lt?: number;
          lte?: number;
          gt?: number;
          gte?: number;
        };
      };
    };
    method?: 'put' | 'patch';
  }) => void;
}

interface InterServerEvents {}

type SocketData = {
  user: UserDto;
  dialog?: Dialog & { user: UserDto; partner: UserDto };
};

namespace IO {
  type Socket = import('socket.io').Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  type Server = import('socket.io').Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
}
