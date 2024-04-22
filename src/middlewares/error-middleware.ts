import { ApiError } from '../exceptions/index';

export const errorMiddleware = (
  err: unknown,
  req: Ex.Request,
  res: Ex.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: Ex.NextFunction,
) => {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ message: err.message, errors: err.errors, status: err.status });
  }

  return res.status(500).json({ status: 500, message: 'Unexpected error' });
};
