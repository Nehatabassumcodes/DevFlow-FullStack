import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

interface RequestSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

// Validates (and replaces) req.body / req.params / req.query with the parsed
// Zod output. A ZodError is forwarded to the error handler as a 400 response.
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as Request['params'];
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request['query'];
      next();
    } catch (err) {
      next(err);
    }
  };
}
