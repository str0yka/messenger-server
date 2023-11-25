import jwt from 'jsonwebtoken';

import { prisma } from '../prisma';

class TokenService {
  generateTokens(payload: Record<string, unknown>) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
      expiresIn: '30m',
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
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
}

export const tokenService = new TokenService();
