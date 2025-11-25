# SSL Current State Architecture Analysis
**Phase 1.1: Codebase Assessment**  
**Date:** November 2025

---

## Executive Summary

The Shakir Super League (SSL) platform is currently a **monolithic** application built with:
- **Backend:** NestJS (modular monolith)
- **Frontend:** Next.js 15 (4 apps: web, admin, marketing, mobile)
- **Database:** Supabase (PostgreSQL with RLS)
- **Monorepo:** Turborepo with pnpm

---

## 1. Project Structure

```
mtk-ssl/
├── apps/
│   ├── web/               # Main user app (app.ssl.cricket)
│   ├── admin/             # Super Admin (admin.ssl.cricket)
│   ├── marketing/         # Landing page (ssl.cricket)
│   └── mobile/            # React Native (Expo)
├── packages/
│   ├── ui/                # Shared components (shadcn/ui)
│   ├── database/          # Drizzle ORM + schemas
│   └── config/            # Shared configs
├── services/
│   └── api/               # NestJS monolithic backend
└── supabase/
    └── migrations/        # 7 SQL migrations
```

---

## 2. Backend Modules (NestJS)

| Module | File | Responsibility | Target Service |
|--------|------|----------------|----------------|
| AppModule | `app.module.ts` | Root module, config | api-gateway |
| TenantsModule | `tenants/tenants.module.ts` | Multi-tenant management | tenant-service |
| ScoringModule | `scoring/scoring.module.ts` | Ball-by-ball scoring | scoring-service |
| MatchesModule | `matches/matches.module.ts` | Match management | tournament-service |
| SslModule | `ssl/ssl.module.ts` | SSL-specific logic | auth-service |

### Controllers (API Endpoints)

| Controller | Endpoints | Priority |
|------------|-----------|----------|
| AppController | Health check, root | P0 |
| TenantsController | CRUD tenants, branding | P0 |
| MatchesController | CRUD matches, innings | P0 |
| SslController | SSL operations | P1 |

---

## 3. Database Schema

### Core Tables (12 tables)

| Table | Purpose | Rows (est.) | Sharding Key |
|-------|---------|-------------|--------------|
| `tenants` | Leagues/organizations | 1K | - |
| `tenant_branding` | White-label config | 1K | tenant_id |
| `users` | User accounts | 50K | - |
| `profiles` | User profiles per tenant | 100K | tenant_id |
| `tournaments` | Tournament definitions | 5K | tenant_id |
| `teams` | Team records | 20K | tenant_id |
| `players` | Player records | 200K | tenant_id |
| `venues` | Match venues | 2K | tenant_id |
| `matches` | Match records | 50K | tenant_id |
| `match_innings` | Innings data | 100K | tenant_id |
| `match_balls` | Ball-by-ball (time-series) | 5M+ | tenant_id, match_id |
| `documents` | File records | 10K | tenant_id |
| `media` | Media files | 50K | tenant_id |

### Additional Tables (from migrations 005-007)

| Table | Purpose |
|-------|---------|
| `waitlist` | Pre-launch signups |
| `announcements` | System announcements |
| `feature_flags` | Feature toggles |
| `subscriptions` | Payment subscriptions |
| `white_label_requests` | Enterprise requests |
| `ssl_certificates` | Domain SSL certs |
| `dns_verifications` | Custom domain DNS |
| `commission_rates` | Payment commissions |
| `system_health` | Health metrics |

### Database Features Used
- ✅ UUID v7 (time-ordered)
- ✅ Row Level Security (RLS)
- ✅ Foreign key constraints
- ✅ GIN indexes (array columns)
- ✅ Triggers (updated_at)
- ❌ Partitioning (needed for match_balls)
- ❌ Vector embeddings (needed for AI)
- ❌ TimescaleDB (needed for time-series)

---

## 4. Drizzle ORM Schemas

| Schema File | Tables Defined |
|-------------|----------------|
| `tenants.ts` | tenants |
| `tenant-branding.ts` | tenant_branding |
| `users.ts` | users |
| `profiles.ts` | profiles |
| `tournaments.ts` | tournaments |
| `teams.ts` | teams |
| `players.ts` | players |
| `venues.ts` | venues |
| `matches.ts` | matches |
| `match-innings.ts` | match_innings |
| `match-balls.ts` | match_balls |
| `documents.ts` | documents |
| `media.ts` | media |
| `subscriptions.ts` | subscriptions |
| `feature-flags.ts` | feature_flags |
| `announcements.ts` | announcements |
| `white-label-requests.ts` | white_label_requests |
| `ssl-certificates.ts` | ssl_certificates |
| `dns-verifications.ts` | dns_verifications |
| `email-domain-verifications.ts` | email_domain_verifications |
| `commission-rates.ts` | commission_rates |
| `system-health.ts` | system_health |

---

## 5. Third-Party Integrations

| Service | Purpose | SDK/API |
|---------|---------|---------|
| **Supabase** | Database, Auth, Storage | @supabase/supabase-js |
| **Clerk** | Authentication | @clerk/nextjs |
| **Stripe** | International payments | stripe |
| **JazzCash** | Pakistan payments | Custom API |
| **EasyPaisa** | Pakistan payments | Custom API |
| **Vercel** | Frontend hosting | - |
| **Railway** | Backend hosting | - |

---

## 6. Frontend Apps

### apps/web (Main App)
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** Clerk
- **State:** React Query

### apps/admin (Super Admin)
- **Framework:** Next.js 15
- **Access:** Muhammad Kashif only
- **Features:** Global management, revenue

### apps/marketing (Landing)
- **Framework:** Next.js 15
- **Purpose:** Marketing, SEO

### apps/mobile (Native)
- **Framework:** Expo React Native
- **Features:** Scoring, live updates

---

## 7. Identified Issues & Technical Debt

### Critical
1. **No horizontal scaling** - Monolithic backend
2. **No caching layer** - Direct DB queries
3. **No event streaming** - Synchronous operations
4. **No real-time optimization** - Basic WebSocket

### High Priority
1. **No CQRS** - Read/write coupled
2. **No API versioning** - Breaking changes risk
3. **No rate limiting** - DoS vulnerability
4. **No circuit breakers** - Cascade failures

### Medium Priority
1. **No distributed tracing** - Debug difficulty
2. **No centralized logging** - Log fragmentation
3. **No feature flags** - Hard deployments
4. **No A/B testing** - No experimentation

---

## 8. Service Decomposition Plan

| Current | Target Service | Communication | Data Store |
|---------|----------------|---------------|------------|
| AppModule | api-gateway | REST/gRPC | - |
| TenantsModule | tenant-service | gRPC | PostgreSQL |
| ScoringModule | scoring-service | WebSocket + Kafka | TimescaleDB + Redis |
| MatchesModule | tournament-service | gRPC + Kafka | PostgreSQL |
| - (new) | auth-service | gRPC | PostgreSQL + Redis |
| - (new) | analytics-service | Kafka | ClickHouse |
| - (new) | payment-service | gRPC + Kafka | PostgreSQL |
| - (new) | notification-service | Kafka | Redis |
| - (new) | ai-commentary-service | gRPC | PostgreSQL + Vector |

---

## 9. Performance Baseline

### To Be Measured (Week 1 Tasks)

| Metric | Tool | Target |
|--------|------|--------|
| API Response Time (p95) | Artillery | < 500ms |
| Database Query Time | pg_stat_statements | < 100ms |
| Frontend LCP | Lighthouse | < 2.5s |
| Frontend FCP | Lighthouse | < 1.8s |
| Bundle Size | Webpack Analyzer | < 200KB |
| Memory Usage | Node metrics | < 512MB |

---

## 10. Next Steps

1. ✅ Document current architecture (this document)
2. ⏳ Run performance baseline tests
3. ⏳ Create C4 architecture diagrams
4. ⏳ Define service boundaries (DDD)
5. ⏳ Plan database migration strategy
6. ⏳ Set up project management (Jira/Linear)

---

*Generated: November 2025*  
*Phase 1.1 of SSL Enterprise Migration*
