import bcrypt from 'bcrypt';

import { UserDto } from '../dtos/index.js';
import { ApiError } from '../exceptions/index.js';
import { prisma } from '../prisma/index.js';

import { mailService } from './mail-service.js';
import { tokenService } from './token-service.js';

class UserService {
  generateVerificationCode() {
    return Number(
      Array(4)
        .fill(null)
        .map(() => Math.floor(Math.random() * 10))
        .join(''),
    );
  }

  async registration(email: string, password: string) {
    const candidate = await prisma.user.findUnique({ where: { email } });

    if (candidate?.isVerified) {
      throw ApiError.BadRequest('User with this email already exist');
    }

    const hashPassword = await bcrypt.hash(password, 3);
    const verificationCode = this.generateVerificationCode();

    let user: User;
    if (candidate) {
      user = await prisma.user.update({
        where: { email },
        data: { email, password: hashPassword, verificationCode },
      });
    } else {
      user = await prisma.user.create({
        data: { email, password: hashPassword, verificationCode },
      });
    }
    await mailService.sendVerificationCode(user.email, verificationCode);

    const userDto = UserDto(user);

    return { user: userDto };
  }

  async verify(id: User['id'], verificationCode: number) {
    const candidate = await prisma.user.findUnique({ where: { id } });

    if (!candidate) {
      throw ApiError.BadRequest('User isn`t exist');
    }

    if (candidate.isVerified) {
      throw ApiError.BadRequest('User with this email already verified');
    }

    if (candidate.verificationCode !== verificationCode) {
      throw ApiError.BadRequest('The verification code is incorrect');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified: true, verificationCode: null },
    });

    const userDto = UserDto(user);
    const tokens = tokenService.generateTokens(userDto);
    await tokenService.saveToken(user.id, tokens.refreshToken);

    return { user: userDto, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw ApiError.BadRequest('User isn`t exist');
    }

    const isPasswordsEqual = await bcrypt.compare(password, user.password);

    if (!isPasswordsEqual) {
      throw ApiError.BadRequest('The password is incorrect');
    }

    const userDto = UserDto(user);
    const tokens = tokenService.generateTokens(userDto);
    await tokenService.saveToken(user.id, tokens.refreshToken);

    return { user: userDto, ...tokens };
  }

  async logout(refreshToken: Token['refreshToken']) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    return tokenService.removeToken(refreshToken);
  }

  async refresh(refreshToken: Token['refreshToken']) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const userFromDb = await prisma.user.findUnique({ where: { id: userData.id } });

    if (!userFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const userDto = UserDto(userFromDb);
    const tokens = tokenService.generateTokens(userDto);
    await tokenService.saveToken(userFromDb.id, tokens.refreshToken);

    return { user: userDto, ...tokens };
  }
}

export const userService = new UserService();
