import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }

  @Get('ready')
  readiness() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  liveness() {
    return this.healthService.checkLiveness();
  }
}
