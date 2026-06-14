import { rateLimit } from 'express-rate-limit';
import { env } from '../config/environment.js';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  skip: () => env.NODE_ENV === 'test',
});
