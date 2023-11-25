namespace Ex {
  type Request<
    Params = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = qs.ParsedQs,
    Locals extends Record<string, any> = Record<string, any>,
  > = import('express').Request<Params, ResBody, ReqBody, ReqQuery, Locals>;
  type Response<
    ResBody = any,
    Locals extends Record<string, any> = Record<string, any>,
  > = import('express').Response<ResBody, Locals>;
  type NextFunction = import('express').NextFunction;
}
