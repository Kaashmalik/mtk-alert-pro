# Phase 7: Enterprise Features Implementation
**Duration:** Weeks 27-30 (4 weeks)  
**Budget Allocation:** $50,000 (10%)

## 7.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| Advanced RBAC | OPA/Casbin policies deployed |
| Multi-tenancy | Schema-per-tenant isolation |
| Analytics dashboard | Real-time with Apache Flink |
| Audit logging | Blockchain immutability (enterprise) |
| White-label portal | Custom branding for tenants |

## 7.2 Prerequisites

- [ ] Phase 6 performance optimized
- [ ] Database sharding complete
- [ ] Kafka streaming operational

## 7.3 Key Activities

### Week 27: Advanced RBAC

```typescript
// services/auth-service/src/rbac/casbin.service.ts
import { Enforcer, newEnforcer } from 'casbin';
import { TypeORMAdapter } from 'typeorm-adapter';

export class CasbinService {
  private enforcer: Enforcer;
  
  async initialize() {
    const adapter = await TypeORMAdapter.newAdapter({
      type: 'postgres',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
    
    this.enforcer = await newEnforcer('rbac_model.conf', adapter);
  }
  
  async checkPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    return this.enforcer.enforce(userId, tenantId, resource, action);
  }
  
  async addPolicy(
    role: string,
    tenant: string,
    resource: string,
    action: string
  ) {
    await this.enforcer.addPolicy(role, tenant, resource, action);
  }
}
```

```conf
# services/auth-service/rbac_model.conf
[request_definition]
r = sub, tenant, obj, act

[policy_definition]
p = sub, tenant, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.tenant) && r.tenant == p.tenant && r.obj == p.obj && r.act == p.act
```

```typescript
// Predefined roles
const roles = {
  SUPER_ADMIN: {
    permissions: ['*:*:*'], // Full access
  },
  TENANT_ADMIN: {
    permissions: [
      'tournament:*:*',
      'team:*:*',
      'user:read:*',
      'user:update:own',
      'analytics:read:*',
    ],
  },
  SCORER: {
    permissions: [
      'match:read:*',
      'scoring:*:assigned',
    ],
  },
  VIEWER: {
    permissions: [
      'match:read:public',
      'tournament:read:public',
      'team:read:public',
    ],
  },
};
```

### Week 28: Multi-Tenancy Enhancement

```typescript
// packages/database/src/tenancy/tenant-context.ts
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  schemaName: string;
  userId?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext {
  const context = tenantStorage.getStore();
  if (!context) {
    throw new Error('Tenant context not initialized');
  }
  return context;
}

// Middleware for NestJS
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);
    const tenant = await this.tenantService.findById(tenantId);
    
    tenantStorage.run(
      {
        tenantId: tenant.id,
        schemaName: `tenant_${tenant.slug}`,
        userId: req.user?.id,
      },
      () => next()
    );
  }
  
  private extractTenantId(req: Request): string {
    // From subdomain: league.ssl.cricket
    const host = req.headers.host;
    const subdomain = host?.split('.')[0];
    
    // Or from header
    return req.headers['x-tenant-id'] as string || subdomain;
  }
}
```

```sql
-- Schema-per-tenant setup
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_slug TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS tenant_%s', tenant_slug);
  
  -- Copy template tables
  EXECUTE format('
    CREATE TABLE tenant_%s.tournaments (LIKE tenant_template.tournaments INCLUDING ALL);
    CREATE TABLE tenant_%s.teams (LIKE tenant_template.teams INCLUDING ALL);
    CREATE TABLE tenant_%s.matches (LIKE tenant_template.matches INCLUDING ALL);
    CREATE TABLE tenant_%s.players (LIKE tenant_template.players INCLUDING ALL);
  ', tenant_slug, tenant_slug, tenant_slug, tenant_slug);
  
  -- Set up RLS
  EXECUTE format('
    ALTER TABLE tenant_%s.tournaments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tenant_%s.teams ENABLE ROW LEVEL SECURITY;
  ', tenant_slug, tenant_slug);
END;
$$ LANGUAGE plpgsql;
```

### Week 29: Analytics Dashboard

```typescript
// services/analytics-service/src/flink/streaming.ts
import { FlinkSQL } from '@apache/flink-sql-gateway';

export class AnalyticsStreaming {
  private flink: FlinkSQL;
  
  async createRealTimeAggregations() {
    // Real-time player performance
    await this.flink.execute(`
      CREATE TABLE player_performance_stream (
        player_id STRING,
        tenant_id STRING,
        runs INT,
        balls INT,
        wickets INT,
        event_time TIMESTAMP(3),
        WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
      ) WITH (
        'connector' = 'kafka',
        'topic' = 'ssl.scoring.ball-events',
        'properties.bootstrap.servers' = 'kafka:9092',
        'format' = 'json'
      )
    `);
    
    // Aggregated view
    await this.flink.execute(`
      CREATE TABLE player_stats_sink (
        player_id STRING,
        tenant_id STRING,
        window_start TIMESTAMP(3),
        total_runs INT,
        strike_rate DOUBLE,
        PRIMARY KEY (player_id, tenant_id, window_start) NOT ENFORCED
      ) WITH (
        'connector' = 'jdbc',
        'url' = 'jdbc:postgresql://postgres:5432/analytics',
        'table-name' = 'player_realtime_stats'
      )
    `);
    
    // Tumbling window aggregation
    await this.flink.execute(`
      INSERT INTO player_stats_sink
      SELECT 
        player_id,
        tenant_id,
        TUMBLE_START(event_time, INTERVAL '1' MINUTE) as window_start,
        SUM(runs) as total_runs,
        SUM(runs) * 100.0 / SUM(balls) as strike_rate
      FROM player_performance_stream
      GROUP BY 
        player_id, 
        tenant_id,
        TUMBLE(event_time, INTERVAL '1' MINUTE)
    `);
  }
}
```

```tsx
// apps/admin/src/components/AnalyticsDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { AreaChart, BarChart, LineChart } from 'recharts';

export function AnalyticsDashboard({ tenantId }: { tenantId: string }) {
  const { data: realtimeStats } = useQuery({
    queryKey: ['analytics', tenantId, 'realtime'],
    queryFn: () => fetchRealtimeStats(tenantId),
    refetchInterval: 5000, // 5 second refresh
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={realtimeStats?.liveMatches}>
            <Line type="monotone" dataKey="viewers" stroke="#22c55e" />
          </LineChart>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart data={realtimeStats?.revenue}>
            <Area dataKey="amount" fill="#22c55e" fillOpacity={0.3} />
          </AreaChart>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={realtimeStats?.topPlayers} layout="vertical">
            <Bar dataKey="runs" fill="#22c55e" />
          </BarChart>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Week 30: White-Label Portal

```typescript
// apps/admin/src/components/BrandingPortal.tsx
export function BrandingPortal({ tenant }: { tenant: Tenant }) {
  const [branding, setBranding] = useState(tenant.branding);
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Custom Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div>
            <Label>Logo</Label>
            <ImageUpload
              value={branding.logo}
              onChange={(url) => setBranding({ ...branding, logo: url })}
            />
          </div>
          
          {/* Color Scheme */}
          <div>
            <Label>Primary Color</Label>
            <ColorPicker
              value={branding.primaryColor}
              onChange={(color) => setBranding({ ...branding, primaryColor: color })}
            />
          </div>
          
          {/* Custom Domain */}
          <div>
            <Label>Custom Domain</Label>
            <Input
              value={branding.customDomain}
              onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
              placeholder="yourleague.com"
            />
            <p className="text-sm text-muted-foreground mt-1">
              CNAME your domain to ssl.cricket
            </p>
          </div>
          
          {/* Remove SSL Branding (Enterprise) */}
          {tenant.plan === 'enterprise' && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={branding.removePoweredBy}
                onCheckedChange={(v) => setBranding({ ...branding, removePoweredBy: v })}
              />
              <Label>Remove "Powered by SSL" branding</Label>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
```

## 7.4 Success Metrics

| Metric | Target |
|--------|--------|
| RBAC policy evaluation | < 10ms |
| Tenant isolation | 100% verified |
| Analytics latency | < 5s real-time |
| White-label setup time | < 5 minutes |

## 7.5 Post-Phase Review Checklist

- [ ] RBAC with Casbin deployed
- [ ] Multi-tenancy isolation verified
- [ ] Analytics streaming operational
- [ ] Audit logging complete
- [ ] White-label portal functional
- [ ] Enterprise features documented
