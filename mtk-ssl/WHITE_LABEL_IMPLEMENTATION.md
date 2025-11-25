# White-Label Enterprise Implementation

Complete white-label solution for Enterprise clients in Shakir Super League (SSL).

## Overview

This implementation provides a comprehensive white-label system that allows Enterprise clients to:
- Use custom domains (e.g., `myleague.com`)
- Remove all "Shakir Super League" branding
- Customize app name, logo, colors, favicon
- Configure custom email sender domain
- Rebrand mobile apps (iOS/Android)
- Hide pricing pages
- Use custom login pages

**Malik Tech branding** appears only in the footer (and only when white-label is not enabled).

## Architecture

### Database Schema

New tables added:
- `dns_verifications` - DNS verification for custom domains
- `ssl_certificates` - SSL certificate management (Let's Encrypt)
- `email_domain_verifications` - DKIM/SPF verification for email domains

Enhanced tables:
- `tenants` - Added `custom_domain_verified`, `ssl_enabled`, `email_domain_verified`
- `tenant_branding` - Added email, mobile app, and database instance fields

### Components

#### 1. Branding Settings Page (`/settings/branding`)

Located at: `apps/web/src/app/settings/branding/page.tsx`

Features:
- Visual branding (logo, colors, favicon, app name)
- Custom domain configuration with DNS verification
- Email domain setup with DKIM/SPF verification
- Mobile app branding (icon, splash, bundle IDs)
- Real-time verification status

#### 2. DNS Verification

**API Endpoints:**
- `GET /api/dns/verify?domain=...` - Check verification status
- `POST /api/dns/verify` - Initiate DNS verification

**Process:**
1. User enters custom domain
2. System generates verification token
3. User adds TXT record to DNS
4. System verifies DNS record
5. Domain is marked as verified

#### 3. SSL Certificate Automation

**Service:** `services/api/src/ssl/ssl.service.ts`

Features:
- Automatic Let's Encrypt certificate issuance
- DNS-01 challenge support
- Certificate renewal (30 days before expiry)
- Certificate storage and management

**Endpoints:**
- `POST /ssl/issue/:tenantId/:domain` - Issue certificate
- `POST /ssl/renew` - Renew expiring certificates

**Note:** Requires `acme-client` package installation:
```bash
cd services/api
pnpm add acme-client
```

#### 4. Email Domain Verification

**API Endpoints:**
- `GET /api/email/verify?domain=...` - Check verification status
- `POST /api/email/verify` - Initiate email verification

**Process:**
1. User enters email sender address (e.g., `no-reply@myleague.com`)
2. System generates SPF, DKIM, and DMARC records
3. User adds DNS records
4. System verifies records
5. Email domain is marked as verified

#### 5. Mobile App Rebranding

**Files:**
- `apps/mobile/app.config.js` - Dynamic Expo config
- `apps/mobile/eas.json` - EAS Build configuration
- `apps/mobile/scripts/build-white-label.js` - Build script

**Process:**
1. Tenant configures mobile app branding in settings
2. Build script fetches tenant branding
3. Expo config is generated with custom values
4. EAS Build creates branded apps

**Usage:**
```bash
cd apps/mobile
EXPO_PUBLIC_TENANT_ID=<tenant-id> EXPO_PUBLIC_PLAN=enterprise node scripts/build-white-label.js <tenant-id>
```

#### 6. Custom Login Page

Located at: `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`

Features:
- Detects tenant from domain
- Applies tenant branding (logo, colors, background)
- Custom styling via Clerk appearance API

#### 7. Middleware

Located at: `apps/web/src/middleware.ts`

Features:
- Detects tenant from custom domain or subdomain
- Loads tenant branding
- Passes tenant info to pages via headers
- Handles authentication

#### 8. Pricing Page Hiding

**Marketing Site:** `apps/marketing/src/app/page.tsx`

- Checks tenant plan
- Hides pricing section for Enterprise tenants
- Conditionally renders based on tenant

#### 9. Malik Tech Branding

**Footer Component:** `apps/marketing/src/components/footer.tsx`

- Shows Malik Tech branding only when `hideSslBranding` is false
- Single location for all Malik Tech attribution
- Format: "Software made by Malik Tech • Offered by SSL • Developed by Muhammad Kashif • kaash054@gmail.com"

## Setup Instructions

### 1. Database Migration

Run the new migration:
```bash
# If using Supabase CLI
supabase migration up

# Or run directly in Supabase dashboard
# See: supabase/migrations/007_white_label_enterprise.sql
```

### 2. Install Dependencies

```bash
# Install acme-client for SSL automation (optional, for production)
cd services/api
pnpm add acme-client

# Install @radix-ui/react-tabs (already in package.json)
cd packages/ui
pnpm install
```

### 3. Environment Variables

Add to `.env.local`:
```env
# SSL Certificate Automation
ACME_ENVIRONMENT=staging  # or "production" for live
```

### 4. Access Branding Settings

1. Navigate to `/settings/branding` in the web app
2. Configure branding options
3. Set up custom domain (Enterprise only)
4. Configure email domain (Enterprise only)
5. Set up mobile app branding (Enterprise only)

## Usage Flow

### For Enterprise Clients

1. **Upgrade to Enterprise Plan**
   - Contact admin or upgrade via dashboard

2. **Configure Branding**
   - Go to Settings > Branding
   - Upload logo, set colors, customize app name
   - Enable "Hide SSL Branding" for full white-label

3. **Set Up Custom Domain**
   - Enter domain (e.g., `myleague.com`)
   - Click "Start DNS Verification"
   - Add TXT record to DNS
   - System automatically issues SSL certificate

4. **Configure Email Domain**
   - Enter sender email (e.g., `no-reply@myleague.com`)
   - Click "Start Email Verification"
   - Add SPF, DKIM, DMARC records to DNS
   - System verifies and enables custom email

5. **Mobile App Branding** (Optional)
   - Upload app icon and splash screen
   - Set bundle IDs (iOS/Android)
   - Build branded apps via EAS

## API Reference

### Branding Settings

- `GET /api/settings/branding` - Get current branding
- `PUT /api/settings/branding` - Update branding

### DNS Verification

- `GET /api/dns/verify?domain=...` - Check status
- `POST /api/dns/verify` - Initiate verification

### SSL Certificates

- `GET /api/ssl/status?domain=...` - Get certificate status
- `POST /ssl/issue/:tenantId/:domain` - Issue certificate (backend)

### Email Verification

- `GET /api/email/verify?domain=...` - Check status
- `POST /api/email/verify` - Initiate verification

## Security Considerations

1. **DNS Verification**: Prevents domain hijacking
2. **SSL Certificates**: Stored securely, encrypted at rest
3. **Email Verification**: Prevents email spoofing
4. **Tenant Isolation**: RLS policies ensure data isolation

## Future Enhancements

- [ ] DNS provider API integration (Cloudflare, Route53)
- [ ] Automated DNS record management
- [ ] Certificate monitoring and alerts
- [ ] Email deliverability testing
- [ ] Separate database instances (optional)
- [ ] Custom subdomain routing

## Support

For issues or questions:
- Email: kaash054@gmail.com
- Developer: Muhammad Kashif
- Company: Malik Tech (MTK)

---

**Note:** This implementation requires Enterprise plan. Some features (like SSL automation) require additional infrastructure setup in production.

