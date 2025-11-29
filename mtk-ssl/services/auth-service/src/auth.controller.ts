import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService, ValidateTokenResponse } from './auth.service';

interface GrpcValidateTokenRequest {
  token: string;
  tenant_id?: string;
}

interface CheckPermissionRequest {
  user_id: string;
  tenant_id: string;
  resource: string;
  action: string;
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(request: GrpcValidateTokenRequest): Promise<ValidateTokenResponse> {
    return this.authService.validateToken({
      token: request.token,
      tenantId: request.tenant_id,
    });
  }

  @GrpcMethod('AuthService', 'CheckPermission')
  async checkPermission(request: CheckPermissionRequest) {
    const allowed = await this.authService.checkPermission(
      request.user_id,
      request.tenant_id,
      request.resource,
      request.action,
    );
    return { allowed };
  }

  @GrpcMethod('AuthService', 'GetUserRoles')
  async getUserRoles(request: { user_id: string; tenant_id: string }) {
    const roles = await this.authService.getUserRoles(
      request.user_id,
      request.tenant_id,
    );
    return { roles };
  }
}
