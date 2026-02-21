import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorMiddleware: ErrorRequestHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  console.error(`[Error] ${statusCode} — ${err.message}`);
  if (statusCode === 500) console.error(err.stack);

  res.status(statusCode).json({
    error: err.name ?? 'Error',
    message,
    statusCode,
  });
};
