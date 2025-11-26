import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@ssl.cricket');
    
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log('Email transport configured');
    } else {
      this.logger.warn('SMTP not configured - emails in mock mode');
    }
  }

  async send(dto: SendEmailDto): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(`[MOCK] Email to ${dto.to}: ${dto.subject}`);
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: dto.to,
        subject: dto.subject,
        text: dto.body,
        html: dto.html || this.wrapInTemplate(dto.subject, dto.body),
      });

      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const template = this.getTemplate(templateName, data);
    return this.send({
      to,
      subject: template.subject,
      body: template.text,
      html: template.html,
    });
  }

  private getTemplate(
    name: string,
    data: Record<string, unknown>,
  ): { subject: string; text: string; html: string } {
    const templates: Record<string, { subject: string; text: string; html: string }> = {
      match_reminder: {
        subject: `🏏 Match Reminder: ${data.matchName}`,
        text: `Your match "${data.matchName}" is starting soon!`,
        html: this.wrapInTemplate(
          `Match Reminder`,
          `<h2>Your match is starting soon!</h2>
          <p><strong>${data.matchName}</strong></p>
          <p>Venue: ${data.venue}</p>
          <p>Time: ${data.time}</p>`,
        ),
      },
      registration_confirmed: {
        subject: `✅ Registration Confirmed`,
        text: `Your registration for ${data.tournamentName} has been confirmed!`,
        html: this.wrapInTemplate(
          `Registration Confirmed`,
          `<h2>You're all set!</h2>
          <p>Your team <strong>${data.teamName}</strong> is registered for <strong>${data.tournamentName}</strong>.</p>`,
        ),
      },
    };

    return templates[name] || {
      subject: 'SSL Notification',
      text: JSON.stringify(data),
      html: this.wrapInTemplate('Notification', JSON.stringify(data)),
    };
  }

  private wrapInTemplate(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 24px; text-align: center; }
    .content { padding: 24px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 16px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏏 Shakir Super League</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2025 Shakir Super League. All rights reserved.</p>
      <p>Pakistan's #1 Cricket Tournament Platform</p>
    </div>
  </div>
</body>
</html>`;
  }
}
