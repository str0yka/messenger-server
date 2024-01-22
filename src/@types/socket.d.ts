interface ServerToClientEvents {
  'dialogs:put': (
    dialogs: (Dialog & {
      user: UserDto;
      partner: UserDto;
      lastMessage: Message | null;
      _count: { messages: number };
    })[],
  ) => void;
  'dialog:put': (dialog: Dialog & { user: UserDto; partner: UserDto }) => void;
  'dialogs:updateRequired': () => void;
  'messages:patch': (messages: Message[]) => void;
  'message:patch': (message: Message) => void;
  'message:add': (message: Message) => void;
  'message:delete': (message: Message) => void;
}

interface ClientToServerEvents {
  'dialog:getOrCreate': (partnerId: number) => void;
  'dialogs:get': () => void;
  'messages:get': (
    dialogId: number,
    sort?: {
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
          lt?: Message['createdAt'];
          lte?: Message['createdAt'];
          gt?: Message['createdAt'];
          gte?: Message['createdAt'];
        };
      };
    },
  ) => void;
  'message:read': (messageId: number) => void;
  'message:delete': (messageId: number, dialogId: number, deleteForEveryone?: boolean) => void;
  'message:add': (chatId: number, message: string) => void;
}

interface InterServerEvents {}

type SocketData = UserDto;

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
