import morgan from 'morgan';
import { logger } from '../utils/logger.js';
import { env } from '../config/environment.js';

const format = env.NODE_ENV === 'production' ? 'combined' : 'dev';

export const httpLogger = morgan(format, {
  stream: {
    write: (message: string) => {
      logger.http(message.trim());
    },
  },
});
