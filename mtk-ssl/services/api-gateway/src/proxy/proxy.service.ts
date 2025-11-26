import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

interface ServiceConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc';
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly serviceMap: Record<string, ServiceConfig>;

  constructor(private readonly configService: ConfigService) {
    this.serviceMap = {
      'auth-service': {
        host: configService.get('AUTH_SERVICE_HOST', 'auth-service'),
        port: configService.get('AUTH_SERVICE_PORT', 5001),
        protocol: 'grpc',
      },
      'tournament-service': {
        host: configService.get('TOURNAMENT_SERVICE_HOST', 'tournament-service'),
        port: configService.get('TOURNAMENT_SERVICE_PORT', 5002),
        protocol: 'grpc',
      },
      'scoring-service': {
        host: configService.get('SCORING_SERVICE_HOST', 'scoring-service'),
        port: configService.get('SCORING_SERVICE_PORT', 4000),
        protocol: 'http',
      },
      'analytics-service': {
        host: configService.get('ANALYTICS_SERVICE_HOST', 'analytics-service'),
        port: configService.get('ANALYTICS_SERVICE_PORT', 5003),
        protocol: 'http',
      },
      'payment-service': {
        host: configService.get('PAYMENT_SERVICE_HOST', 'payment-service'),
        port: configService.get('PAYMENT_SERVICE_PORT', 5004),
        protocol: 'grpc',
      },
      'notification-service': {
        host: configService.get('NOTIFICATION_SERVICE_HOST', 'notification-service'),
        port: configService.get('NOTIFICATION_SERVICE_PORT', 5005),
        protocol: 'http',
      },
    };
  }

  async forward(req: Request, res: Response, serviceName: string): Promise<void> {
    const service = this.serviceMap[serviceName];
    
    if (!service) {
      throw new HttpException(`Service ${serviceName} not found`, HttpStatus.SERVICE_UNAVAILABLE);
    }

    const targetUrl = `${service.protocol}://${service.host}:${service.port}${req.path}`;
    
    this.logger.debug(`Forwarding ${req.method} ${req.path} to ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          ...this.extractHeaders(req),
          'X-Forwarded-For': req.ip || '',
          'X-Forwarded-Host': req.hostname,
          'X-Request-Id': req.headers['x-request-id'] as string || crypto.randomUUID(),
        },
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      
      res.status(response.status).json(data);
    } catch (error) {
      this.logger.error(`Failed to forward to ${serviceName}: ${error}`);
      throw new HttpException(
        `Service ${serviceName} unavailable`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private extractHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    const forwardHeaders = [
      'content-type',
      'authorization',
      'x-tenant-id',
      'x-user-id',
      'x-user-roles',
      'accept-language',
    ];

    forwardHeaders.forEach(header => {
      const value = req.headers[header];
      if (value && typeof value === 'string') {
        headers[header] = value;
      }
    });

    return headers;
  }
}
