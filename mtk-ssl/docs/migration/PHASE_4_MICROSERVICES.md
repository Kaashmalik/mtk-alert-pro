# Phase 4: Backend Microservices Decomposition
**Duration:** Weeks 12-17 (6 weeks)  
**Budget Allocation:** $100,000 (20%)

## 4.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| API Gateway deployed | Kong/Traefik routing all traffic |
| Core services extracted | auth, tournament, scoring live |
| Event streaming | Kafka/NATS handling all events |
| gRPC communication | Inter-service calls < 10ms |
| CQRS implemented | Read/write separation complete |
| 80% test coverage | All services |

## 4.2 Prerequisites

- [ ] Phase 3 database complete
- [ ] Kubernetes ready
- [ ] Team trained on microservices patterns

## 4.3 Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (Kong)                      │
│              Rate Limiting, Auth, Routing                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐      ┌──────────────┐
│ Auth Service │     │  Tournament  │      │   Scoring    │
│    (gRPC)    │     │   Service    │      │   Service    │
└──────────────┘     └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │   Apache Kafka   │
                    │  Event Streaming │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐      ┌──────────────┐
│  Analytics   │     │ Notification │      │   Payment    │
│   Service    │     │   Service    │      │   Service    │
└──────────────┘     └──────────────┘      └──────────────┘
```

## 4.4 Key Activities

### Week 12-13: API Gateway

```yaml
# infrastructure/kubernetes/gateway/kong-config.yaml
apiVersion: configuration.konghq.com/v1
kind: KongIngress
metadata:
  name: ssl-gateway
proxy:
  protocol: https
  read_timeout: 60000
  write_timeout: 60000
route:
  strip_path: true
  preserve_host: true
---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limiting
config:
  minute: 100
  hour: 10000
  policy: redis
  redis_host: redis-cluster
---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: jwt-auth
config:
  claims_to_verify:
    - exp
    - iat
  key_claim_name: kid
```

### Week 14-15: Core Services

```typescript
// services/auth-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(__dirname, './proto/auth.proto'),
        url: '0.0.0.0:5000',
      },
    },
  );
  
  // Connect to Kafka for events
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: process.env.KAFKA_BROKERS?.split(','),
      },
      consumer: { groupId: 'auth-consumer' },
    },
  });

  await app.startAllMicroservices();
}
```

```protobuf
// services/auth-service/proto/auth.proto
syntax = "proto3";
package auth;

service AuthService {
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateSession(CreateSessionRequest) returns (Session);
}

message ValidateTokenRequest {
  string token = 1;
  string tenant_id = 2;
}

message User {
  string id = 1;
  string email = 2;
  string tenant_id = 3;
  repeated string roles = 4;
}
```

### Week 16-17: Event Streaming

```typescript
// services/scoring-service/src/events/scoring.events.ts
import { Injectable } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class ScoringEventsService {
  private producer: Producer;
  
  async publishBallEvent(event: BallEvent) {
    await this.producer.send({
      topic: 'ssl.scoring.ball-events',
      messages: [{
        key: event.matchId,
        value: JSON.stringify(event),
        headers: {
          'event-type': 'BALL_RECORDED',
          'tenant-id': event.tenantId,
        },
      }],
    });
  }
  
  async publishWicketEvent(event: WicketEvent) {
    await this.producer.send({
      topic: 'ssl.scoring.wicket-events',
      messages: [{
        key: event.matchId,
        value: JSON.stringify(event),
        headers: { 'event-type': 'WICKET_FALLEN' },
      }],
    });
  }
}
```

```yaml
# infrastructure/kafka/topics.yaml
topics:
  - name: ssl.scoring.ball-events
    partitions: 12
    replication: 3
    config:
      retention.ms: 604800000  # 7 days
      
  - name: ssl.tournament.events
    partitions: 6
    replication: 3
    
  - name: ssl.notifications
    partitions: 6
    replication: 3
    
  - name: ssl.analytics.events
    partitions: 12
    replication: 3
```

## 4.5 CQRS Implementation

```typescript
// services/tournament-service/src/cqrs/commands/create-tournament.handler.ts
@CommandHandler(CreateTournamentCommand)
export class CreateTournamentHandler {
  constructor(
    private readonly eventStore: EventStore,
    private readonly kafka: KafkaService,
  ) {}
  
  async execute(command: CreateTournamentCommand) {
    // Create aggregate
    const tournament = Tournament.create(command);
    
    // Persist events
    await this.eventStore.save(tournament.uncommittedEvents);
    
    // Publish to Kafka for read models
    await this.kafka.publish('ssl.tournament.events', {
      type: 'TournamentCreated',
      data: tournament.toDTO(),
    });
    
    return tournament.id;
  }
}

// Query side (read model)
@QueryHandler(GetTournamentQuery)
export class GetTournamentHandler {
  constructor(private readonly readDb: ReadDatabase) {}
  
  async execute(query: GetTournamentQuery) {
    return this.readDb.tournaments.findById(query.id);
  }
}
```

## 4.6 Success Metrics

| Metric | Target |
|--------|--------|
| Service latency (p95) | < 50ms |
| gRPC call latency | < 10ms |
| Kafka throughput | > 10K msg/s |
| Test coverage | 80% |
| API uptime | 99.9% |

## 4.7 Post-Phase Review Checklist

- [ ] All core services deployed
- [ ] API Gateway routing correctly
- [ ] Kafka streaming all events
- [ ] gRPC communication working
- [ ] CQRS patterns implemented
- [ ] Integration tests passing
- [ ] Load tests completed
