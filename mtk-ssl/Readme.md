# Shakir Super League (SSL)  
**Pakistan’s #1 Cricket Tournament & League Management Platform**  
Built by **Malik Tech (MTK)** • Owned & Led by **Muhammad Kashif**

![Shakir Super League](https://raw.githubusercontent.com/maliktech/shakir-super-league/main/public/og-image.png)

**Live Demo:** https://ssl.cricket  
**Marketing Site:** https://shakirsuperleague.com  
**Documentation:** https://docs.ssl.cricket  
**Super Admin:** https://admin.ssl.cricket (Only accessible to Muhammad Kashif)

---

## About Shakir Super League

**Shakir Super League (SSL)** is the most powerful, modern, mobile-first, multi-tenant cricket tournament management SaaS built exclusively for Pakistan and the global Pakistani diaspora.

From gali cricket to professional leagues — SSL handles everything:
- Tournament creation (Knockout, League, Hybrid)
- Team & player registration with payments
- Live ball-by-ball scoring (offline-first)
- Real-time scorecards, Manhattan, Wagon Wheel, Worm
- Points table, NRR, DLS, Super Over
- Fan engagement, live streaming, fantasy
- White-label & custom domain for big leagues
- AI-powered Urdu + English commentary (coming soon)

Used by thousands of leagues across Pakistan, UAE, UK, Canada & Saudi Arabia.

---

## Features

| Category               | Features                                                                                          |
|------------------------|---------------------------------------------------------------------------------------------------|
| Tournament Management  | Knockout • Round Robin • Group + Knockout • Custom brackets • Auto scheduling • DLS • Super Over |
| Live Scoring           | Ball-by-ball • Offline sync • Multiple scorers • Wagon wheel • Manhattan • Worm • Voice scoring |
| Teams & Players        | Full profiles • Stats • Batting/Bowling roles • Jersey numbers • Transfer history               |
| Payments (Pakistan)    | JazzCash • EasyPaisa • Bank Transfer • Credit Card • Subscription per league                    |
| Fan Experience         | Live scores • Push notifications • Highlights • Predictions • Fantasy cricket                   |
| White-Label (Enterprise)| Custom domain • Remove SSL branding • Custom app name • Dedicated support                      |
| Analytics              | Leaderboards • Player ratings • Win probability • Performance graphs                             |
| Mobile Apps            | Native iOS & Android (Expo) • PWA • Offline scoring                                             |
| Languages              | Urdu + English (Full RTL/LTR support)                                                            |

---

## Tech Stack (2025 Enterprise Grade)

| Layer             | Technology                                      |
|-------------------|-------------------------------------------------|
| Monorepo          | Turborepo + pnpm                                |
| Frontend          | Next.js 15 (App Router) + React 19 + TypeScript |
| UI                | Tailwind CSS + shadcn/ui + Framer Motion        |
| Mobile            | Expo React Native + EAS Build                   |
| Backend           | NestJS (Modular)                                |
| Database          | Supabase (PostgreSQL + RLS + Storage)           |
| Auth              | Clerk (Multi-tenant ready)                      |
| Real-time         | Socket.io + Redis (Upstash)                     |
| Payments          | Stripe • JazzCash • EasyPaisa                   |
| Storage           | Supabase Storage + Cloudflare R2               |
| Deployment        | Vercel • Railway • Supabase • Expo              |
| SEO               | next-seo • Sitemap • Structured Data            |
| Analytics         | PostHog (Self-hosted ready)                     |
| Error Tracking    | Sentry                                          |

---

## Project Structure

```bash
shakir-super-league/
├── apps/
│   ├── web/               # Main app (app.ssl.cricket)
│   ├── admin/             # Super Admin Panel (admin.ssl.cricket)
│   ├── marketing/         # Landing page (ssl.cricket)
│   └── mobile/            # React Native app (iOS/Android)
├── packages/
│   ├── ui/                # Shared shadcn/ui + cricket components
│   ├── database/          # Drizzle ORM + Supabase types
│   ├── socket/            # Real-time types & client
│   └── config/            # Shared ESLint, Tailwind, TS config
├── services/
│   └── api/               # NestJS backend (multi-tenant)
├── supabase/
│   ├── migrations/        # All SQL + RLS policies
│   └── functions/         # Edge functions
├── .github/workflows/     # CI/CD pipelines
└── turbo.json
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- pnpm ≥ 8
- Supabase account
- Clerk.dev project
- Stripe + JazzCash accounts

```bash
# Clone repository
git clone https://github.com/maliktech/shakir-super-league.git
cd shakir-super-league

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit with your keys (Supabase, Clerk, Stripe, JazzCash, etc.)

# Start Supabase locally (optional)
supabase start

# Run all apps
pnpm run dev
```

### Default URLs
| App              | URL                     |
|------------------|-------------------------|
| Marketing Site   | http://localhost:3000   |
| Web App          | http://localhost:3001   |
| Super Admin      | http://localhost:3002   |
| NestJS API       | http://localhost:4000   |
| Expo Mobile      | expo start              |

---

## Environment Variables (.env.example)

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Payments primary 
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_HASH_KEY=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Super Admin
SUPER_ADMIN_EMAIL=kaash0542@gmail.com
```

---

## Multi-Tenancy & White-Label

- Every league = tenant (`tenants` table)
- Subdomain: `yourleague.ssl.cricket`
- Custom domain: `yourleague.com` (Enterprise)
- Full branding control (logo, colors, favicon)
- Remove “Powered by SSL” (White-label)

---

## Deployment

### One-Click Deploy

| Service       | Link |
|---------------|------|
| Vercel (Frontend) | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmaliktech%2Fshakir-super-league) |
| Railway (API) | Deploy on Railway |
| Supabase      | Connect project |
| Expo          | EAS Build |

---

## Super Admin Access

Only **Muhammad Kashif** has access to:
- Global revenue dashboard
- Suspend any league
- Impersonate users
- Approve white-label requests
- Push global updates

---

## Contributing

We welcome contributions!  
See [CONTRIBUTING.md](CONTRIBUTING.md)

```bash
git checkout -b feature/amazing-scoring-ui
git commit -m "feat: add wagon wheel with shot direction"
git push origin feature/amazing-scoring-ui
```

---

## Support

- Documentation: https://docs.ssl.cricket
- Email: support@ssl.cricket
- WhatsApp: +92 300 1234567
- Discord: https://discord.gg/sslcricket
- Twitter/X: [@ShakirSuperL](https://twitter.com/ShakirSuperL)

---

## License

Proprietary • Owned by **Malik Tech (MTK)**  
White-label licenses available for enterprises.

---

**Shakir Super League** — Built with ❤️ for cricket lovers in Pakistan and worldwide.  
**Malik Tech • Muhammad Kashif • 2025–2026**

Let’s make every league legendary.  
#SSLTakeover #PakistaniCricketTech #MalikTech

--- 

**Star this repo if you believe in the future of Pakistani cricket technology!**  
https://github.com/Kaashmalik/mtk-ssl.git

Made with pride in Pakistan