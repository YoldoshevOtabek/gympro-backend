import type { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  ((req, res, next) => {
    fn(req, res, next).catch(next);
  }) as RequestHandler;