import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/environment.js';
import { httpLogger } from './middlewares/logger.middleware.js';
import { rateLimiter } from './middlewares/rate-limiter.middleware.js';
import { helloRouter } from './modules/hello/hello.router.js';
import { errorHandler } from './errors/error-handler.middleware.js';
import { NotFoundError } from './errors/app-error.js';

const app: Express = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use(httpLogger);

// Global Rate Limiting
app.use(rateLimiter);

// HTML Diagnostics Screens
import { HelloController } from './modules/hello/hello.controller.js';
const helloController = new HelloController();

app.get('/node', helloController.getNodeHelloHtml);
app.get('/express', helloController.getExpressHelloHtml);
app.get('/', (_req, res) => {
  res.redirect('/node');
});

// API Endpoints
app.use('/api/v1/hello', helloRouter);

// Catch 404 and pass to error handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('The requested resource does not exist.'));
});

// Centralized Error Handler Boundary
app.use(errorHandler);

export { app };
