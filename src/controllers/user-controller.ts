import { userService, verificationService } from '../services';

class UserController {
  async registration(req: Ex.Request, res: Ex.Response<{ user: UserDto }>, next: Ex.NextFunction) {
    try {
      const { email, name, password } = req.body;

      const userData = await userService.registration({ email, name, password });

      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });

      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async login(
    req: Ex.Request,
    res: Ex.Response<{ user: UserDto; refreshToken: Token['refreshToken'] }>,
    next: Ex.NextFunction,
  ) {
    try {
      const { email, password } = req.body;

      const userData = await userService.login({ email, password });

      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });

      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async verify(
    req: Ex.Request<{ id: User['id'] }>,
    res: Ex.Response<{ user: UserDto; refreshToken: Token['refreshToken'] }>,
    next: Ex.NextFunction,
  ) {
    try {
      const userId = Number(req.params.id);
      const { verificationCode } = req.body;

      const userData = await verificationService.verify(userId, verificationCode);

      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });

      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async logout(req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) {
    try {
      const { refreshToken } = req.cookies;

      await userService.logout({ refreshToken });

      res.clearCookie('refreshToken');

      return res.status(204).json({});
    } catch (e) {
      next(e);
    }
  }

  async refresh(
    req: Ex.Request,
    res: Ex.Response<{ user: UserDto; refreshToken: Token['refreshToken'] }>,
    next: Ex.NextFunction,
  ) {
    try {
      const { refreshToken } = req.cookies;

      const userData = await userService.refresh({ refreshToken });

      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });

      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async update(req: Ex.Request, res: Ex.Response<{ user: UserDto }>, next: Ex.NextFunction) {
    try {
      const user = req.user!;

      const updateFields = req.body;

      const userData = await userService.update({ id: user.id, ...updateFields });

      return res.json({ user: userData });
    } catch (e) {
      next(e);
    }
  }
}

export const userController = new UserController();
