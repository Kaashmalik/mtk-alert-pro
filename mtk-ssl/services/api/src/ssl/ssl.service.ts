import { Injectable, Logger } from "@nestjs/common";
import { db } from "@mtk/database";
import { sslCertificates, tenants, dnsVerifications } from "@mtk/database";
import { eq, and, lt } from "drizzle-orm";
// Note: Install acme-client: pnpm add acme-client
// import * as acme from "acme-client";
import * as fs from "fs/promises";
import * as path from "path";

// Placeholder for acme-client (install separately)
const acme = {
  directory: {
    letsencrypt: {
      production: "https://acme-v02.api.letsencrypt.org/directory",
      staging: "https://acme-staging-v02.api.letsencrypt.org/directory",
    },
  },
  crypto: {
    createPrivateKey: async () => Buffer.from("placeholder"),
    createCsr: async () => [Buffer.from("key"), Buffer.from("csr")],
  },
  Client: class {
    constructor() {}
    async createOrder() {}
    async getAuthorizations() {}
    async getChallengeKeyAuthorization() {}
    async verifyChallenge() {}
    async completeChallenge() {}
    async waitForValidStatus() {}
    async finalizeOrder() {}
    async getCertificate() {}
  },
};

@Injectable()
export class SslService {
  private readonly logger = new Logger(SslService.name);
  private acmeClient: any;

  constructor() {
    this.initializeAcmeClient();
  }

  /**
   * Initialize Let's Encrypt ACME client
   */
  private async initializeAcmeClient() {
    try {
      // Use Let's Encrypt staging for development, production for live
      const directoryUrl =
        process.env.ACME_ENVIRONMENT === "production"
          ? acme.directory.letsencrypt.production
          : acme.directory.letsencrypt.staging;

      // Load or create account key
      const accountKeyPath = path.join(process.cwd(), "ssl-keys", "account-key.pem");
      let accountKey: Buffer;

      try {
        accountKey = await fs.readFile(accountKeyPath);
      } catch {
        // Generate new account key if it doesn't exist
        const accountKeyPair = await acme.crypto.createPrivateKey();
        await fs.mkdir(path.dirname(accountKeyPath), { recursive: true });
        await fs.writeFile(accountKeyPath, accountKeyPair);
        accountKey = accountKeyPair;
      }

      this.acmeClient = new acme.Client({
        directoryUrl,
        accountKey,
      });

      this.logger.log("ACME client initialized");
    } catch (error) {
      this.logger.error("Failed to initialize ACME client", error);
    }
  }

  /**
   * Issue SSL certificate for a domain
   */
  async issueCertificate(tenantId: string, domain: string): Promise<any> {
    try {
      // Check if DNS is verified
      const dnsVerification = await db
        .select()
        .from(dnsVerifications)
        .where(
          and(
            eq(dnsVerifications.tenantId, tenantId),
            eq(dnsVerifications.domain, domain),
            eq(dnsVerifications.status, "verified")
          )
        )
        .limit(1);

      if (dnsVerification.length === 0) {
        throw new Error("DNS verification required before SSL certificate issuance");
      }

      // Check if certificate already exists
      const existing = await db
        .select()
        .from(sslCertificates)
        .where(
          and(
            eq(sslCertificates.tenantId, tenantId),
            eq(sslCertificates.domain, domain)
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0].status === "active") {
        return existing[0];
      }

      // Create or update certificate record
      const certificateData = {
        tenantId,
        domain,
        status: "pending" as const,
      };

      let certificateId: string;
      if (existing.length > 0) {
        await db
          .update(sslCertificates)
          .set(certificateData)
          .where(eq(sslCertificates.id, existing[0].id));
        certificateId = existing[0].id;
      } else {
        const [inserted] = await db
          .insert(sslCertificates)
          .values(certificateData)
          .returning();
        certificateId = inserted.id;
      }

      // Generate CSR
      const [key, csr] = await acme.crypto.createCsr({
        commonName: domain,
      });

      // Create order
      const order = await this.acmeClient.createOrder({
        identifiers: [{ type: "dns", value: domain }],
      });

      // Get authorizations
      const authorizations = await this.acmeClient.getAuthorizations(order);

      // Complete HTTP-01 challenge
      for (const authz of authorizations) {
        if (authz.status === "valid") {
          continue;
        }

        const challenge = authz.challenges.find((c: any) => c.type === "http-01");
        if (!challenge) {
          throw new Error("HTTP-01 challenge not found");
        }

        // Store challenge token (in production, serve this at /.well-known/acme-challenge/)
        const challengeToken = challenge.token;
        const challengeKeyAuthorization = await this.acmeClient.getChallengeKeyAuthorization(challenge);

        // Verify challenge (in production, this should be served by the web server)
        // For now, we'll use DNS-01 challenge instead
        const dnsChallenge = authz.challenges.find((c: any) => c.type === "dns-01");
        if (dnsChallenge) {
          const dnsKeyAuthorization = await this.acmeClient.getChallengeKeyAuthorization(dnsChallenge);
          const dnsRecord = `_acme-challenge.${domain}. TXT ${dnsKeyAuthorization}`;

          // Store DNS challenge record (user needs to add this)
          // In production, integrate with DNS provider API (Cloudflare, Route53, etc.)
          this.logger.log(`DNS challenge record: ${dnsRecord}`);

          // Wait for DNS propagation (simplified)
          await this.waitForDnsPropagation(`_acme-challenge.${domain}`, dnsKeyAuthorization);

          // Verify challenge
          await this.acmeClient.verifyChallenge(authz, dnsChallenge);
          await this.acmeClient.completeChallenge(dnsChallenge);
          await this.acmeClient.waitForValidStatus(dnsChallenge);
        }
      }

      // Finalize order
      await this.acmeClient.finalizeOrder(order, csr);

      // Download certificate
      const cert = await this.acmeClient.getCertificate(order);

      // Store certificate and key
      const certDir = path.join(process.cwd(), "ssl-certs", tenantId);
      await fs.mkdir(certDir, { recursive: true });

      const certPath = path.join(certDir, `${domain}.crt`);
      const keyPath = path.join(certDir, `${domain}.key`);

      await fs.writeFile(certPath, cert);
      await fs.writeFile(keyPath, key);

      // Update certificate record
      const expiresAt = this.extractExpiryDate(cert);
      await db
        .update(sslCertificates)
        .set({
          certificateUrl: certPath,
          privateKeyUrl: keyPath,
          status: "active",
          issuedAt: new Date(),
          expiresAt,
          lastRenewedAt: new Date(),
        })
        .where(eq(sslCertificates.id, certificateId));

      // Update tenant
      await db
        .update(tenants)
        .set({ sslEnabled: true })
        .where(eq(tenants.id, tenantId));

      this.logger.log(`SSL certificate issued for ${domain}`);

      const updated = await db
        .select()
        .from(sslCertificates)
        .where(eq(sslCertificates.id, certificateId))
        .limit(1);

      return updated[0];
    } catch (error) {
      this.logger.error(`Failed to issue SSL certificate for ${domain}`, error);

      // Update certificate status to failed
      const existing = await db
        .select()
        .from(sslCertificates)
        .where(
          and(
            eq(sslCertificates.tenantId, tenantId),
            eq(sslCertificates.domain, domain)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(sslCertificates)
          .set({
            status: "failed",
            errorMessage: error.message,
          })
          .where(eq(sslCertificates.id, existing[0].id));
      }

      throw error;
    }
  }

  /**
   * Renew certificates that are expiring soon
   */
  async renewExpiringCertificates(): Promise<void> {
    try {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const expiring = await db
        .select()
        .from(sslCertificates)
        .where(
          and(
            eq(sslCertificates.status, "active"),
            eq(sslCertificates.autoRenew, true),
            lt(sslCertificates.expiresAt, thirtyDaysFromNow)
          )
        );

      for (const cert of expiring) {
        try {
          this.logger.log(`Renewing certificate for ${cert.domain}`);
          await this.issueCertificate(cert.tenantId, cert.domain);
        } catch (error) {
          this.logger.error(`Failed to renew certificate for ${cert.domain}`, error);
        }
      }
    } catch (error) {
      this.logger.error("Error renewing certificates", error);
    }
  }

  /**
   * Wait for DNS propagation (simplified)
   */
  private async waitForDnsPropagation(hostname: string, expectedValue: string): Promise<void> {
    // In production, implement actual DNS checking
    // For now, wait 60 seconds
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }

  /**
   * Extract expiry date from certificate
   */
  private extractExpiryDate(cert: string): Date {
    // Parse certificate to extract expiry date
    // Simplified - in production use proper certificate parsing
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  }
}

