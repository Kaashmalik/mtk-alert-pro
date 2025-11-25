import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(":id")
  async getMatch(@Param("id") id: string) {
    return this.matchesService.findOne(id);
  }

  @Get(":id/teams")
  async getMatchTeams(@Param("id") id: string) {
    return this.matchesService.getMatchTeams(id);
  }

  @Get(":id/players")
  async getMatchPlayers(@Param("id") id: string) {
    return this.matchesService.getMatchPlayers(id);
  }

  @Get(":id/innings/:inningsNumber")
  async getInnings(
    @Param("id") id: string,
    @Param("inningsNumber") inningsNumber: string
  ) {
    return this.matchesService.getInnings(id, parseInt(inningsNumber));
  }

  @Post(":id/innings/:inningsNumber/start")
  async startInnings(
    @Param("id") id: string,
    @Param("inningsNumber") inningsNumber: string,
    @Body() data: { teamId: string; batsmen: string[]; bowler: string }
  ) {
    return this.matchesService.startInnings(
      id,
      parseInt(inningsNumber),
      data
    );
  }
}

