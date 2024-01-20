interface ServerToClientEvents {
  'dialogs:put': (
    dialogs: (Dialog & {
      user: UserDto;
      partner: UserDto;
      lastMessage: Message | null;
      _count: { messages: number };
    })[],
  ) => void;
  'dialog:put': (dialog: Dialog & { user: UserDto; partner: UserDto; messages: Message[] }) => void;
  'dialogs:updateRequired': () => void;
  'message:patch': (message: Message) => void;
  'messages:add': (message: Message) => void;
  'message:delete': (message: Message) => void;
}

interface ClientToServerEvents {
  'dialog:getOrCreate': (partnerId: number) => void;
  'dialogs:get': () => void;
  'message:read': (messageId: number) => void;
  'message:delete': (messageId: number, dialogId: number, deleteForEveryone?: boolean) => void;
  'messages:add': (chatId: number, message: string) => void;
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
