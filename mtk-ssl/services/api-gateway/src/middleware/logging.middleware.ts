import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const tenantId = req.headers['x-tenant-id'] || 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;

      const logMessage = `${method} ${originalUrl} ${statusCode} ${duration}ms ${contentLength}b`;
      
      const logContext = {
        method,
        url: originalUrl,
        statusCode,
        duration,
        contentLength,
        ip,
        userAgent,
        tenantId,
        timestamp: new Date().toISOString(),
      };

      if (statusCode >= 500) {
        this.logger.error(logMessage, JSON.stringify(logContext));
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, JSON.stringify(logContext));
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
