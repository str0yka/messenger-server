namespace Ex {
  type Request<
    Params = {
      [key: string]: string;
    },
    ResBody = any,
    ReqBody = any,
    ReqQuery = qs.ParsedQs,
    Locals extends Record<string, any> = Record<string, any>,
  > = import('express').Request<Params, ResBody, ReqBody, ReqQuery, Locals> & { user?: UserDto };
  type Response<
    ResBody = any,
    Locals extends Record<string, any> = Record<string, any>,
  > = import('express').Response<ResBody, Locals>;
  type NextFunction = import('express').NextFunction;
}
