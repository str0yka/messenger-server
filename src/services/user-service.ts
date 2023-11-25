import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { UserDto } from '~/dtos';
import { ApiError } from '~/exceptions';
import { prisma } from '~/prisma';

import { mailService } from './mail-service';
import { tokenService } from './token-service';

class UserService {
  async registration(email: string, password: string) {
    const candidate = await prisma.user.findFirst({ where: { email } });

    if (candidate) {
      throw ApiError.BadRequest('User with this email already exist');
    }

    const hashPassword = await bcrypt.hash(password, 3);
    const verifyLink = uuid();

    const user = await prisma.user.create({ data: { email, password: hashPassword, verifyLink } });
    await mailService.sendVerifyMail(user.email, `${process.env.API_URL}/api/verify/${verifyLink}`);

    const userDto = UserDto(user);
    const tokens = tokenService.generateTokens(userDto);
    await tokenService.saveToken(user.id, tokens.refreshToken);

    return { user: userDto, ...tokens };
  }
}

export const userService = new UserService();
