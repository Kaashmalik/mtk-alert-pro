import { Controller, All, Req, Res, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('auth/*')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'auth-service');
  }

  @All('tournaments/*')
  async proxyTournaments(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'tournament-service');
  }

  @All('matches/*')
  async proxyMatches(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'tournament-service');
  }

  @All('scoring/*')
  async proxyScoring(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'scoring-service');
  }

  @All('analytics/*')
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'analytics-service');
  }

  @All('payments/*')
  async proxyPayments(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'payment-service');
  }

  @All('notifications/*')
  async proxyNotifications(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'notification-service');
  }
}
