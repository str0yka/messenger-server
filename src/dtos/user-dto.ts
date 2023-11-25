export const UserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  isVerified: user.isVerified,
});
