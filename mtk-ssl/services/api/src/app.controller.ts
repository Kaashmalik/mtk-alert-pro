import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

/**
 * Root API controller
 * Health check and basic info endpoints
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      service: "SSL API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  }
}

