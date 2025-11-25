# ADR 002: Database Strategy

**Status:** Accepted  
**Date:** November 2025  
**Deciders:** Muhammad Kashif, Tech Lead

## Context

Current state: Single PostgreSQL database (Supabase) serving all services with 22 tables. Expected growth to 5M+ ball-by-ball records requires optimization.

## Decision

### Multi-Database Architecture

| Database | Purpose | Services |
|----------|---------|----------|
| PostgreSQL 17+ | Transactional data | tenant, tournament, auth |
| TimescaleDB | Time-series (ball-by-ball) | scoring-service |
| Redis Cluster | Caching, sessions, pub/sub | All services |
| ClickHouse | Analytics, reports | analytics-service |
| pgvector | AI embeddings | ai-commentary-service |

### Sharding Strategy

- **Shard key:** `tenant_id` for all tenant-specific tables
- **Extension:** Citus for horizontal sharding
- **Partitioning:** Time-based for `match_balls` table

### Data Ownership

| Service | Owned Tables |
|---------|--------------|
| tenant-service | tenants, tenant_branding |
| auth-service | users, profiles, sessions |
| tournament-service | tournaments, teams, players, venues, matches |
| scoring-service | match_innings, match_balls |
| payment-service | subscriptions, payments, commission_rates |
| analytics-service | aggregated views, reports |

## Consequences

### Positive
- Optimized storage for each use case
- Independent scaling per service
- Better query performance

### Negative
- Complex data synchronization
- Cross-service joins not possible
- Higher operational overhead

## Implementation

1. Keep Supabase for auth and small tables
2. Add TimescaleDB for ball-by-ball data
3. Add Redis Cluster for caching
4. Add ClickHouse for analytics (Phase 7)
