import bcrypt from 'bcrypt';

import { UserDto } from '../dtos';
import { ApiError } from '../exceptions';
import { prisma } from '../prisma';

import { mailService } from './mail-service';
import { tokenService } from './token-service';
import { verificationService } from './verification-service';

class UserService {
  async registration(email: string, password: string) {
    const candidate = await prisma.user.findUnique({ where: { email } });

    if (candidate?.isVerified) {
      throw ApiError.BadRequest('User with this email already exist');
    }

    const hashPassword = await bcrypt.hash(password, 3);

    let user: User;
    if (candidate) {
      user = await prisma.user.update({
        where: { email },
        data: { email, password: hashPassword },
      });
    } else {
      user = await prisma.user.create({
        data: { email, password: hashPassword },
      });
    }

    const verificationCode = verificationService.generateVerificationCode();
    await verificationService.saveVerificationCode(user.id, verificationCode);

    await mailService.sendVerificationCode(user.email, verificationCode);

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

    await tokenService.removeToken(refreshToken);
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

  async search(queries: Ex.Request['query']) {
    const query = queries.query;
    let limit = queries.limit ?? 50;
    let page = queries.page ?? 1;

    if (!query) {
      throw ApiError.BadRequest('The query must contain search parameters');
    }

    if (typeof query !== 'string') {
      throw ApiError.BadRequest('Incorrect query type');
    }

    if (Array.isArray(limit) || isNaN(Number(limit))) {
      throw ApiError.BadRequest('Incorrect limit type');
    }

    if (Array.isArray(page) || isNaN(Number(page))) {
      throw ApiError.BadRequest('Incorrect page type');
    }

    limit = Number(limit);
    page = Number(page);

    return prisma.user.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: {
        email: { contains: query },
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }
}

export const userService = new UserService();
