import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

export const validate = (schemas: RequestSchemas): RequestHandler => (req, _res, next) => {
  req.validated = {
    body: schemas.body ? schemas.body.parse(req.body) : req.body,
    query: schemas.query ? schemas.query.parse(req.query) : req.query,
    params: schemas.params ? schemas.params.parse(req.params) : req.params,
  };
  next();
};
