# SSL Monorepo Setup Guide

## Quick Start

```bash
# Install pnpm (if not already installed)
npm install -g pnpm@8.15.0

# Install all dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys

# Start all apps in development mode
pnpm dev
```

## Project Structure

```
shakir-super-league/
├── apps/
│   ├── web/              # Main app (localhost:3001)
│   ├── admin/            # Super Admin (localhost:3002)
│   ├── marketing/        # Landing page (localhost:3000)
│   └── mobile/           # Expo React Native app (iOS & Android)
├── packages/
│   ├── ui/               # Shared UI components (shadcn/ui)
│   ├── config/           # Shared configs (ESLint, Tailwind)
│   └── database/         # Supabase client + Drizzle schema
├── services/
│   └── api/              # NestJS backend (localhost:4000)
└── supabase/
    └── migrations/      # Database migrations
```

## Development URLs

| App              | URL                     |
|------------------|-------------------------|
| Marketing Site   | http://localhost:3000   |
| Web App          | http://localhost:3001   |
| Super Admin      | http://localhost:3002   |
| NestJS API       | http://localhost:4000   |

## Environment Variables

See `.env.example` for all required environment variables:

- **Supabase**: Database and storage
- **Clerk**: Authentication
- **Payments**: JazzCash, EasyPaisa, Stripe
- **Redis**: Upstash for real-time features

## Available Scripts

- `pnpm dev` - Start all apps in development
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts

## Next Steps

1. Set up Supabase project and get credentials
2. Create Clerk.dev project and get API keys
3. Configure payment gateways (JazzCash, Stripe)
4. Run database migrations
5. Start building features!

## Support

- Documentation: https://docs.ssl.cricket
- Email: support@ssl.cricket

