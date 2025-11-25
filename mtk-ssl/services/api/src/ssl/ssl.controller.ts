import { Controller, Post, Get, Param, UseGuards } from "@nestjs/common";
import { SslService } from "./ssl.service";

@Controller("ssl")
export class SslController {
  constructor(private readonly sslService: SslService) {}

  @Post("issue/:tenantId/:domain")
  async issueCertificate(
    @Param("tenantId") tenantId: string,
    @Param("domain") domain: string
  ) {
    return this.sslService.issueCertificate(tenantId, domain);
  }

  @Post("renew")
  async renewCertificates() {
    await this.sslService.renewExpiringCertificates();
    return { success: true };
  }
}

