declare type User = import('@prisma/client').User;
declare type UserDto = Pick<User, 'id' | 'email' | 'isVerified'>;
declare type Token = import('@prisma/client').Token;
