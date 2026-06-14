import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/environment.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    logger.warn(`Operational Error [${err.statusCode}]: ${err.message}`);
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  logger.error(`Unhandled programming error: ${err.message}`, {
    stack: err.stack,
  });

  const message = env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  const stack = env.NODE_ENV === 'production' ? undefined : err.stack;

  res.status(500).json({
    status: 'error',
    message,
    ...(stack && { stack }),
  });
};
