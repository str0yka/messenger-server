import jwt from 'jsonwebtoken';

import { prisma } from '../prisma';

class TokenService {
  generateTokens(payload: Record<string, unknown>) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
      expiresIn: '30m',
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  async saveToken(userId: User['id'], refreshToken: Token['refreshToken']) {
    const tokenData = await prisma.token.findUnique({ where: { userId } });

    if (tokenData) {
      return prisma.token.update({ where: { userId }, data: { refreshToken } });
    }

    return prisma.token.create({ data: { userId, refreshToken } });
  }

  validateRefreshToken(refreshToken: Token['refreshToken']) {
    try {
      const userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
      return userData as UserDto;
    } catch (e) {
      return null;
    }
  }

  validateAccessToken(refreshToken: string) {
    try {
      const userData = jwt.verify(refreshToken, process.env.JWT_ACCESS_SECRET as string);
      return userData as UserDto;
    } catch (e) {
      return null;
    }
  }

  async removeToken(refreshToken: Token['refreshToken']) {
    return prisma.token.deleteMany({ where: { refreshToken } });
  }

  async findToken(refreshToken: Token['refreshToken']) {
    return prisma.token.findFirst({ where: { refreshToken } });
  }
}

export const tokenService = new TokenService();
