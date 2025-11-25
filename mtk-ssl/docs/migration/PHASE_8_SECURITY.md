# Phase 8: Security and Compliance Enhancements
**Duration:** Weeks 31-34 (4 weeks)  
**Budget Allocation:** $50,000 (10%)

## 8.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| Zero-trust architecture | BeyondCorp model implemented |
| Security headers | A+ rating on securityheaders.com |
| Rate limiting | Adaptive ML-based protection |
| Encryption | Kyber quantum-resistant ready |
| Compliance | ISO 27001, SOC 2, GDPR ready |
| Vulnerability scans | Zero critical/high issues |

## 8.2 Prerequisites

- [ ] Phase 7 enterprise features complete
- [ ] Security team trained on zero-trust
- [ ] Compliance requirements documented

## 8.3 Key Activities

### Week 31: Zero-Trust Architecture

```yaml
# infrastructure/kubernetes/security/istio-authz.yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ssl-zero-trust
  namespace: ssl-production
spec:
  selector:
    matchLabels:
      app: ssl
  action: ALLOW
  rules:
    # Only allow authenticated requests
    - from:
        - source:
            requestPrincipals: ["*"]
      when:
        - key: request.auth.claims[iss]
          values: ["https://clerk.ssl.cricket"]
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: ssl-mtls
  namespace: ssl-production
spec:
  mtls:
    mode: STRICT
```

```typescript
// services/api-gateway/src/middleware/zero-trust.ts
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class ZeroTrustMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Verify device attestation
    const deviceToken = req.headers['x-device-attestation'];
    if (deviceToken) {
      const isValid = await this.verifyDeviceAttestation(deviceToken);
      if (!isValid) {
        throw new UnauthorizedException('Device not trusted');
      }
    }
    
    // 2. Check context-aware access
    const accessDecision = await this.contextAwareAccess({
      userId: req.user?.id,
      deviceId: req.headers['x-device-id'],
      ipAddress: req.ip,
      geoLocation: await this.getGeoLocation(req.ip),
      requestedResource: req.path,
      riskScore: await this.calculateRiskScore(req),
    });
    
    if (!accessDecision.allowed) {
      // Step-up authentication required
      if (accessDecision.requireMFA) {
        throw new UnauthorizedException('MFA required', { code: 'MFA_REQUIRED' });
      }
      throw new ForbiddenException('Access denied by policy');
    }
    
    next();
  }
  
  private async calculateRiskScore(req: Request): Promise<number> {
    let score = 0;
    
    // New device
    if (!(await this.isKnownDevice(req.user?.id, req.headers['x-device-id']))) {
      score += 30;
    }
    
    // Unusual location
    if (await this.isUnusualLocation(req.user?.id, req.ip)) {
      score += 25;
    }
    
    // Unusual time
    if (this.isUnusualTime(req.user?.timezone)) {
      score += 15;
    }
    
    // Sensitive operation
    if (this.isSensitiveOperation(req.method, req.path)) {
      score += 20;
    }
    
    return score;
  }
}
```

### Week 32: Security Headers & Rate Limiting

```typescript
// services/api-gateway/src/middleware/security-headers.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.clerk.dev"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.ssl.cricket", "wss://ws.ssl.cricket"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// Permissions Policy
export const permissionsPolicy = (req, res, next) => {
  res.setHeader('Permissions-Policy', [
    'accelerometer=()',
    'camera=()',
    'geolocation=(self)',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=(self)',
    'usb=()',
  ].join(', '));
  next();
};
```

```typescript
// services/api-gateway/src/middleware/adaptive-rate-limit.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { MLRiskScorer } from './ml-risk-scorer';

export class AdaptiveRateLimiter {
  private readonly limiter: RateLimiterRedis;
  private readonly mlScorer: MLRiskScorer;
  
  constructor(redis: Redis) {
    this.limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl',
      points: 100, // Base limit
      duration: 60, // Per minute
    });
    
    this.mlScorer = new MLRiskScorer();
  }
  
  async consume(req: Request): Promise<void> {
    const key = this.getKey(req);
    
    // Calculate adaptive limit based on ML risk score
    const riskScore = await this.mlScorer.score({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      requestRate: await this.getRequestRate(key),
    });
    
    // Adjust points based on risk
    const adjustedPoints = this.calculateAdjustedPoints(riskScore);
    
    try {
      await this.limiter.consume(key, adjustedPoints);
    } catch (rejRes) {
      throw new TooManyRequestsException({
        retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
        limit: 100,
        remaining: 0,
      });
    }
  }
  
  private calculateAdjustedPoints(riskScore: number): number {
    // Higher risk = more points consumed = lower effective limit
    if (riskScore > 0.8) return 10; // Very suspicious
    if (riskScore > 0.6) return 5;  // Somewhat suspicious
    if (riskScore > 0.4) return 2;  // Slightly elevated
    return 1; // Normal
  }
}
```

### Week 33: Encryption & Compliance

```typescript
// packages/crypto/src/quantum-resistant.ts
import { Kyber } from 'crystals-kyber';

export class QuantumResistantCrypto {
  // Key encapsulation for quantum-resistant key exchange
  async generateKeyPair() {
    const [publicKey, privateKey] = await Kyber.keygen();
    return { publicKey, privateKey };
  }
  
  async encapsulate(publicKey: Uint8Array) {
    const [ciphertext, sharedSecret] = await Kyber.encapsulate(publicKey);
    return { ciphertext, sharedSecret };
  }
  
  async decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array) {
    return await Kyber.decapsulate(ciphertext, privateKey);
  }
  
  // Hybrid encryption (classical + post-quantum)
  async hybridEncrypt(data: Buffer, publicKey: Uint8Array) {
    // Classical ECDH
    const classicalShared = await this.ecdhKeyExchange();
    
    // Post-quantum Kyber
    const { sharedSecret: pqShared, ciphertext } = await this.encapsulate(publicKey);
    
    // Combine secrets
    const combinedSecret = await this.kdf(
      Buffer.concat([classicalShared, pqShared])
    );
    
    // Encrypt with AES-256-GCM
    return this.aesEncrypt(data, combinedSecret);
  }
}
```

```yaml
# infrastructure/compliance/gdpr-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gdpr-compliance
data:
  data-retention-days: "365"
  right-to-erasure-enabled: "true"
  data-portability-enabled: "true"
  consent-required: "true"
  
  # Data classification
  pii-fields: |
    - email
    - phone
    - full_name
    - address
    - date_of_birth
    
  # Encryption requirements
  encryption-at-rest: "AES-256"
  encryption-in-transit: "TLS-1.3"
```

### Week 34: Vulnerability Management

```yaml
# .github/workflows/security-scan.yaml
name: Security Scanning

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * *' # Daily

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
          
  snyk-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
          
  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
            
  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build image
        run: docker build -t ssl/test:${{ github.sha }} .
        
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ssl/test:${{ github.sha }}'
          severity: 'CRITICAL,HIGH'
```

## 8.4 Success Metrics

| Metric | Target |
|--------|--------|
| Security headers grade | A+ |
| Vulnerability scan | Zero critical/high |
| mTLS coverage | 100% |
| Compliance audit | Pass ISO 27001, SOC 2 |
| Incident response time | < 15 minutes |

## 8.5 Post-Phase Review Checklist

- [ ] Zero-trust fully implemented
- [ ] Security headers A+ rating
- [ ] Rate limiting operational
- [ ] Encryption upgraded
- [ ] Compliance documentation complete
- [ ] Vulnerability scans clean
- [ ] Incident response tested
