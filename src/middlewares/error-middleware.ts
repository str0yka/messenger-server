import { ApiError } from '../exceptions';

export const errorMiddleware = (
  err: unknown,
  req: Ex.Request,
  res: Ex.Response,
  next: Ex.NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }

  return res.status(500).json({ message: 'Unexpected error' });
};
