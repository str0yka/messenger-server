import { ApiError } from '../exceptions';
import { tokenService } from '../services';

export const authMiddlware = (req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return next(ApiError.UnauthorizedError());
    }

    const accessToken = authorizationHeader.split(' ')[1];

    if (!accessToken) {
      return next(ApiError.UnauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);

    if (!userData) {
      return next(ApiError.UnauthorizedError());
    }

    req.user = userData;

    next();
  } catch {
    return next(ApiError.UnauthorizedError());
  }
};
