import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

/**
 * Bootstrap the NestJS application
 * Multi-tenant API for Shakir Super League
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://ssl.cricket",
      "https://app.ssl.cricket",
      "https://admin.ssl.cricket",
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global prefix
  app.setGlobalPrefix("api");

  const port = configService.get("PORT") || 4000;
  await app.listen(port);

  console.log(`🚀 SSL API running on: http://localhost:${port}/api`);
  console.log(`📡 WebSocket server ready for real-time scoring`);
}

bootstrap();

