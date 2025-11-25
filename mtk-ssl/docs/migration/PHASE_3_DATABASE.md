# Phase 3: Database Migration and Optimization
**Duration:** Weeks 8-11 (4 weeks)  
**Budget Allocation:** $50,000 (10%)

## 3.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| PostgreSQL 17+ deployed | All environments |
| pgvector enabled | AI embeddings ready |
| TimescaleDB configured | Ball-by-ball time-series |
| Redis Cluster running | Caching and pub/sub |
| Database sharding | Citus extension for multi-tenant |
| Data migration complete | Zero data loss |
| Performance optimized | Query time < 100ms (p95) |

## 3.2 Prerequisites

- [ ] Phase 2 infrastructure complete
- [ ] Kubernetes cluster ready
- [ ] Current database schema documented
- [ ] Backup strategy defined

## 3.3 Key Activities

### Week 8: Database Infrastructure

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";           -- AI embeddings
CREATE EXTENSION IF NOT EXISTS "pg_cron";          -- Scheduled jobs
CREATE EXTENSION IF NOT EXISTS "timescaledb";      -- Time-series

-- Multi-tenancy schemas
CREATE SCHEMA IF NOT EXISTS tenant_template;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;
```

### Week 9: Schema Migration

```sql
-- Tenant management
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Ball-by-ball hypertable
CREATE TABLE public.ball_events (
    time TIMESTAMPTZ NOT NULL,
    match_id UUID NOT NULL,
    innings INTEGER NOT NULL,
    over_number INTEGER NOT NULL,
    ball_number INTEGER NOT NULL,
    runs INTEGER DEFAULT 0,
    extras JSONB,
    wicket JSONB,
    batsman_id UUID NOT NULL,
    bowler_id UUID NOT NULL
);

SELECT create_hypertable('ball_events', 'time');
```

### Week 10: Materialized Views

```sql
-- Player statistics view
CREATE MATERIALIZED VIEW player_season_stats AS
SELECT 
  player_id,
  season_id,
  tenant_id,
  SUM(runs) as total_runs,
  COUNT(*) FILTER (WHERE wicket IS NOT NULL) as total_wickets,
  AVG(strike_rate) as avg_sr,
  embedding vector(1536)  -- For AI similarity
FROM matches m
JOIN ball_events b ON m.id = b.match_id
GROUP BY player_id, season_id, tenant_id;

-- Auto-refresh every 5 minutes
SELECT cron.schedule('refresh-stats', '*/5 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY player_season_stats');

CREATE INDEX idx_player_stats_embedding ON player_season_stats 
  USING ivfflat (embedding vector_cosine_ops);
```

### Week 11: Redis and Caching

```typescript
// packages/database/src/redis/client.ts
import Redis from 'ioredis';

const cluster = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
  scaleReads: 'slave',
});

// Cache patterns
export const cacheKeys = {
  matchState: (matchId: string) => `match:${matchId}:state`,
  playerStats: (playerId: string) => `player:${playerId}:stats`,
  leaderboard: (tournamentId: string) => `tournament:${tournamentId}:leaderboard`,
  tenantConfig: (tenantId: string) => `tenant:${tenantId}:config`,
};
```

## 3.4 Data Migration Strategy

```typescript
// scripts/migrate-data.ts
async function migrateData() {
  // 1. Create backup
  await exec('pg_dump -Fc old_db > backup.dump');
  
  // 2. Migrate in batches
  const batchSize = 10000;
  let offset = 0;
  
  while (true) {
    const records = await oldDb.query(
      `SELECT * FROM matches LIMIT $1 OFFSET $2`,
      [batchSize, offset]
    );
    
    if (records.length === 0) break;
    
    // Transform and insert
    await newDb.query(
      `INSERT INTO matches SELECT * FROM json_populate_recordset(...)`,
      [JSON.stringify(records)]
    );
    
    offset += batchSize;
    console.log(`Migrated ${offset} records`);
  }
  
  // 3. Verify counts
  const oldCount = await oldDb.query('SELECT COUNT(*) FROM matches');
  const newCount = await newDb.query('SELECT COUNT(*) FROM matches');
  
  if (oldCount !== newCount) {
    throw new Error('Data migration verification failed');
  }
}
```

## 3.5 Success Metrics

| Metric | Target |
|--------|--------|
| Data migration | 100% complete, zero loss |
| Query performance (p95) | < 100ms |
| Cache hit rate | > 90% |
| Replication lag | < 1s |

## 3.6 Post-Phase Review Checklist

- [ ] PostgreSQL 17+ running all environments
- [ ] All extensions enabled
- [ ] Data migrated and verified
- [ ] Redis Cluster operational
- [ ] Materialized views refreshing
- [ ] Backup procedures tested
- [ ] Performance benchmarks met
