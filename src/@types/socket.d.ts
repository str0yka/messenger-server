interface ServerToClientEvents {
  'dialogs:put': (
    dialogs: (Dialog & { user: UserDto; partner: UserDto; lastMessage: Message | null })[],
  ) => void;
  'dialog:put': (
    dialogs: (Dialog & { user: UserDto; partner: UserDto; messages: Message[] }) | null,
  ) => void;
  'dialogs:updateRequired': () => void;
  'messages:add': (message: Message) => void;
}

interface ClientToServerEvents {
  'dialog:join': (partnerId: number) => void;
  'dialogs:create': (partnerId: number, partnerEmail: string) => void;
  'dialogs:get': () => void;
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
