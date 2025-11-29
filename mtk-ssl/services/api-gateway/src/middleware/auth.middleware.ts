import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    roles: string[];
  };
  tenantId?: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly publicPaths = [
    '/api/v1/health',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/public',
  ];

  constructor(private readonly configService: ConfigService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip auth for public paths
    if (this.isPublicPath(req.path)) {
      return next();
    }

    // Extract tenant from subdomain or header
    req.tenantId = this.extractTenantId(req);

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      // Verify token with auth service (gRPC call)
      const user = await this.verifyToken(token, req.tenantId);
      req.user = user;
      
      // Add user info to headers for downstream services
      req.headers['x-user-id'] = user.id;
      req.headers['x-tenant-id'] = user.tenantId;
      req.headers['x-user-roles'] = user.roles.join(',');
      
      next();
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private isPublicPath(path: string): boolean {
    return this.publicPaths.some(p => path.startsWith(p));
  }

  private extractTenantId(req: Request): string {
    // From header (API clients)
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) return headerTenant;

    // From subdomain (web clients): league.ssl.cricket
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
      return subdomain;
    }

    return 'default';
  }

  private async verifyToken(token: string, tenantId?: string): Promise<{
    id: string;
    email: string;
    tenantId: string;
    roles: string[];
  }> {
    // TODO: Call auth-service via gRPC
    // For now, decode JWT (in production, use proper verification)
    const payload = this.decodeJwt(token);
    
    return {
      id: String(payload.sub || ''),
      email: String(payload.email || ''),
      tenantId: tenantId || String(payload.tenantId || 'default'),
      roles: Array.isArray(payload.roles) ? payload.roles as string[] : ['user'],
    };
  }

  private decodeJwt(token: string): Record<string, unknown> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      
      const payload = Buffer.from(parts[1], 'base64').toString('utf8');
      return JSON.parse(payload);
    } catch {
      throw new UnauthorizedException('Invalid token format');
    }
  }
}
