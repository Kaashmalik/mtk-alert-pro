# White-Label Implementation Notes

## Important Setup Steps

### 1. Install acme-client for SSL Automation

The SSL certificate automation service requires the `acme-client` package:

```bash
cd services/api
pnpm add acme-client
```

**Note:** The current implementation includes placeholder code. Uncomment the actual import in `services/api/src/ssl/ssl.service.ts` after installing the package.

### 2. Database Migration

Run the migration to create new tables:
```bash
supabase migration up
# Or apply manually: supabase/migrations/007_white_label_enterprise.sql
```

### 3. Middleware Considerations

The middleware in `apps/web/src/middleware.ts` performs database queries. In Next.js, middleware runs on Edge Runtime which has limitations. For production, consider:

- Using a caching layer (Redis) for tenant lookups
- Moving tenant detection to API routes
- Using Vercel Edge Config or similar

### 4. DNS Verification

The DNS verification currently uses placeholder logic. For production, implement actual DNS lookups using:
- Node.js `dns.promises` module
- External DNS API (Cloudflare, Route53)
- DNS library like `dns2`

### 5. SSL Certificate Storage

SSL certificates are stored in `ssl-certs/{tenantId}/` directory. For production:
- Use encrypted storage (S3 with encryption)
- Implement proper key management
- Set up certificate renewal cron job

### 6. Email Verification

Email domain verification requires:
- Proper DKIM key generation (RSA keys)
- SPF record validation
- DMARC policy configuration

Current implementation provides placeholders - implement proper key generation for production.

## Testing

1. **Local Testing:**
   - Use staging Let's Encrypt environment
   - Test DNS verification with local DNS server
   - Mock email verification

2. **Production Testing:**
   - Start with staging certificates
   - Verify DNS propagation
   - Test email deliverability

## Known Limitations

1. **DNS Lookups:** Currently placeholder - needs implementation
2. **SSL Automation:** Requires acme-client package installation
3. **Email Keys:** DKIM key generation is simplified
4. **Middleware:** Database queries in middleware may need optimization

## Next Steps

1. Install `acme-client` package
2. Implement actual DNS lookups
3. Set up certificate renewal cron job
4. Configure production DNS provider integration
5. Test end-to-end white-label flow

