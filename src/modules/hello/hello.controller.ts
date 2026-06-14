import { Request, Response, NextFunction } from 'express';
import { HelloService } from './hello.service.js';

export class HelloController {
  private readonly helloService: HelloService;

  constructor() {
    this.helloService = new HelloService();
  }

  public getExpressHelloHtml = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const message = this.helloService.getHelloMessage('Express.js');
      res.status(200).send(message);
    } catch (error) {
      next(error);
    }
  };

  public getNodeHelloHtml = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const message = this.helloService.getHelloMessage('Raw Node.js');
      res.status(200).send(message);
    } catch (error) {
      next(error);
    }
  };

  public getExpressHello = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const message = this.helloService.getHelloMessage('Express.js');
      const system = this.helloService.getSystemDiagnostics();

      res.status(200).json({
        status: 'success',
        framework: 'Express.js',
        data: {
          message,
          request: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            ip: req.ip,
          },
          system,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public getNodeHello = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const message = this.helloService.getHelloMessage('Raw Node.js');
      const system = this.helloService.getSystemDiagnostics();

      const rawHeaders: Record<string, string | string[] | undefined> = {};
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const key = req.rawHeaders[i]?.toLowerCase();
        const value = req.rawHeaders[i + 1];
        if (key) {
          rawHeaders[key] = value;
        }
      }

      res.status(200).json({
        status: 'success',
        framework: 'Raw Node.js (Simulated)',
        data: {
          message,
          request: {
            method: req.method,
            url: req.url,
            headers: rawHeaders,
            ip: req.socket.remoteAddress,
          },
          system,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
