import { UserDto } from '../dtos';
import { ApiError } from '../exceptions';
import { prisma } from '../prisma';

import { tokenService } from './token-service';

class VerificationService {
  generateVerificationCode(): NonNullable<Verification['verificationCode']> {
    return Array(4)
      .fill(null)
      .map(() => Math.floor(Math.random() * 10))
      .join('');
  }

  async saveVerificationCode(
    userId: User['id'],
    verificationCode: Verification['verificationCode'],
  ) {
    const verificationData = await prisma.verification.findUnique({ where: { userId } });

    if (verificationData) {
      return prisma.verification.update({ where: { userId }, data: { verificationCode } });
    }

    return prisma.verification.create({ data: { userId, verificationCode } });
  }

  async verify(userId: User['id'], verificationCode: Verification['verificationCode']) {
    const candidate = await prisma.user.findUnique({ where: { id: userId } });
    const verificationData = await prisma.verification.findUnique({ where: { userId } });

    if (!candidate) {
      throw ApiError.BadRequest('User isn`t exist');
    }

    if (candidate.isVerified) {
      throw ApiError.BadRequest('User with this email already verified');
    }

    if (!verificationData || verificationData.verificationCode !== verificationCode) {
      throw ApiError.BadRequest('Invalid verification code');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    await prisma.verification.update({ where: { userId }, data: { verificationCode: null } });

    const userDto = UserDto(user);
    const tokens = tokenService.generateTokens(userDto);
    await tokenService.saveToken(user.id, tokens.refreshToken);

    return { user: userDto, ...tokens };
  }
}

export const verificationService = new VerificationService();
