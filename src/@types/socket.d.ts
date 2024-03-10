interface ServerToClientEvents {
  'SERVER:DIALOG_JOIN_RESPONSE': (params: { dialog: DialogDto; messages: Message[] }) => void;
  'SERVER:MESSAGE_READ_RESPONSE': (params: { unreadedMessagesCount: number }) => void;
  'SERVER:MESSAGE_READ': (params: { message: Message }) => void;
  'SERVER:DIALOGS_PUT': (params: { dialogs: DialogDto[] }) => void;
  'SERVER:DIALOGS_NEED_TO_UPDATE': () => void;
  'SERVER:DIALOG_GET_RESPONSE': (params: { dialog: DialogDto }) => void;
  'SERVER:DIALOG_NEED_TO_UPDATE': () => void;
  'SERVER:MESSAGE_ADD': (params: { message: Message }) => void;
  'SERVER:MESSAGE_DELETE': (params: { message: Message }) => void;
  'SERVER:JUMP_TO_DATE_RESPONSE': (params: {
    messages: Message[];
    firstFoundMessage?: Message;
  }) => void;
  'SERVER:MESSAGES_PUT': (params: { messages: Message[] }) => void;
  'SERVER:MESSAGES_PATCH': (params: { messages: Message[] }) => void;
}

interface ClientToServerEvents {
  'CLIENT:DIALOG_JOIN': (params: {
    partner: { id: number } | { username: string };
    messagesLimit?: number;
  }) => void;
  'CLIENT:DIALOG_GET': () => void;
  'CLIENT:DIALOGS_GET': () => void;
  'CLIENT:MESSAGE_READ': (params: { readMessage: Message }) => void;
  'CLIENT:MESSAGE_DELETE': (params: { messageId: number; deleteForEveryone?: boolean }) => void;
  'CLIENT:MESSAGE_ADD': (params: { message: { message: string; createdAt: number } }) => void;
  'CLIENT:MESSAGES_GET': (params: {
    filter?: {
      orderBy?: {
        createdAt?: 'desc' | 'asc';
      };
      take?: number;
      cursor?: {
        id: number;
      };
      skip?: number;
    };
    method?: 'PUT' | 'PATCH';
  }) => void;
  'CLIENT:JUMP_TO_DATE': (params: { timestamp: number; take: number }) => void;
  'CLIENT:UPDATE_DIALOG_STATUS': (params: { status: DialogDto['status'] }) => void;
}

interface InterServerEvents {}

type SocketData = {
  user: Pick<User, 'email' | 'id' | 'isVerified'>;
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
