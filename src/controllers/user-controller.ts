import { userService } from '../services';

class UserController {
  async registration(
    req: Ex.Request,
    res: Ex.Response<{ user: UserDto; refreshToken: Token['refreshToken'] }>,
    next: Ex.NextFunction,
  ) {
    try {
      const { email, password } = req.body;

      const userData = await userService.registration(email, password);

      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });

      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }
}

export const userController = new UserController();
