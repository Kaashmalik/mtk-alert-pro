import { Module } from "@nestjs/common";
import { ScoringGateway } from "./scoring.gateway";
import { ScoringService } from "./scoring.service";

@Module({
  providers: [ScoringGateway, ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}

