import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RbacService } from './rbac/rbac.service';

export interface ValidateTokenRequest {
  token: string;
  tenantId?: string;
}

export interface User {
  id: string;
  email: string;
  tenantIds: string[];
  roles: string[];
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: User;
  error?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  async validateToken(request: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    try {
      // Verify with Clerk
      const _clerkSecretKey = this.configService.get<string>('CLERK_SECRET_KEY');
      
      // In production, use Clerk SDK to verify
      // const clerk = new Clerk({ secretKey: _clerkSecretKey });
      // const session = await clerk.sessions.verifySession(request.token);
      
      // Mock validation for development
      if (!request.token || request.token === 'invalid') {
        return { valid: false, error: 'Invalid token' };
      }

      // Return mock user for now
      const user: User = {
        id: 'user_123',
        email: 'test@ssl.cricket',
        tenantIds: [request.tenantId || 'tenant_default'],
        roles: ['user'],
      };

      return { valid: true, user };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async checkPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    return this.rbacService.checkPermission(userId, tenantId, resource, action);
  }

  async getUserRoles(userId: string, tenantId: string): Promise<string[]> {
    return this.rbacService.getUserRoles(userId, tenantId);
  }

  async assignRole(userId: string, tenantId: string, role: string): Promise<void> {
    await this.rbacService.assignRole(userId, tenantId, role);
  }

  async revokeRole(userId: string, tenantId: string, role: string): Promise<void> {
    await this.rbacService.revokeRole(userId, tenantId, role);
  }
}
