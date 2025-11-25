import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TenantsModule } from "./tenants/tenants.module";
import { ScoringModule } from "./scoring/scoring.module";
import { MatchesModule } from "./matches/matches.module";
import { SslModule } from "./ssl/ssl.module";

/**
 * Root application module
 * Modular architecture for multi-tenant cricket platform
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    // Feature modules
    TenantsModule,
    ScoringModule,
    MatchesModule,
    SslModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

