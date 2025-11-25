# ADR 001: Microservices Migration Strategy

**Status:** Accepted  
**Date:** November 2025  
**Deciders:** Muhammad Kashif, Tech Lead  
**Technical Story:** SSL Enterprise Transformation 2025

## Context

The SSL platform currently runs as a monolithic NestJS application serving all features (tenants, scoring, matches, payments). As the platform scales to thousands of leagues across Pakistan, UAE, UK, Canada, and Saudi Arabia, we face:

1. **Scaling limitations** - Cannot scale individual components
2. **Deployment risk** - Single deployment affects entire system
3. **Team bottlenecks** - All developers work on same codebase
4. **Technology constraints** - Cannot use best tool for each job

## Decision

We will decompose the monolith into **9 microservices** using the Strangler Fig pattern:

| Service | Responsibility | Tech Stack |
|---------|----------------|------------|
| api-gateway | Routing, rate limiting, auth | Kong/NestJS |
| auth-service | Authentication, RBAC | NestJS + gRPC |
| tenant-service | Multi-tenancy, branding | NestJS + gRPC |
| tournament-service | Tournaments, teams, fixtures | NestJS + gRPC |
| scoring-service | Real-time scoring | NestJS + WebSocket + Kafka |
| analytics-service | Stats, reports, predictions | NestJS + ClickHouse |
| payment-service | Stripe, JazzCash, EasyPaisa | NestJS + Kafka |
| notification-service | Push, email, SMS | NestJS + Kafka |
| ai-commentary-service | AI-powered commentary | Python/NestJS + gRPC |

### Communication Patterns

- **Synchronous:** gRPC for inter-service calls (< 10ms latency)
- **Asynchronous:** Apache Kafka for events (scoring, payments, notifications)
- **Real-time:** WebSocket for live updates (scoring-service → clients)

### Data Strategy

- **Database per service** - Each service owns its data
- **Event Sourcing** - For scoring-service (audit trail)
- **CQRS** - Separate read/write models for analytics

## Consequences

### Positive
- Independent scaling of scoring during live matches
- Faster deployments with isolated services
- Team autonomy (different teams own different services)
- Technology flexibility (ClickHouse for analytics, TimescaleDB for time-series)

### Negative
- Increased operational complexity
- Network latency between services
- Distributed transaction challenges
- Higher infrastructure costs

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data consistency | Saga pattern, eventual consistency |
| Service discovery | Kubernetes DNS, Istio |
| Debugging complexity | Distributed tracing (Jaeger) |
| Team learning curve | Training, pair programming |

## Alternatives Considered

1. **Modular Monolith** - Keep monolith but enforce module boundaries
   - Rejected: Still limits scaling and deployment independence

2. **Serverless** - AWS Lambda / Vercel Functions
   - Rejected: Cold starts unacceptable for real-time scoring

3. **Hybrid** - Core services + serverless for non-critical
   - Partially accepted: Will use serverless for batch jobs

## Implementation

### Phase 1 (Q1): Foundation
- Set up Kubernetes cluster
- Deploy API Gateway
- Extract auth-service

### Phase 2 (Q2): Core Services
- Extract scoring-service (highest traffic)
- Extract tournament-service
- Set up Kafka

### Phase 3 (Q3): Supporting Services
- Extract payment-service
- Extract notification-service
- Extract analytics-service

### Phase 4 (Q4): AI & Polish
- Deploy ai-commentary-service
- Decommission monolith
- Performance optimization

## References

- [Microservices Patterns by Chris Richardson](https://microservices.io/patterns/)
- [Domain-Driven Design by Eric Evans](https://dddcommunity.org/)
- [Building Microservices by Sam Newman](https://samnewman.io/books/building_microservices/)
