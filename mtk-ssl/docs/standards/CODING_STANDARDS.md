# SSL Coding Standards

## TypeScript

### General
- Use TypeScript strict mode
- Prefer `const` over `let`
- No `any` types (use `unknown` if needed)
- Export types from dedicated `types.ts` files

### Naming
```typescript
// Classes: PascalCase
class TournamentService {}

// Interfaces: PascalCase with 'I' prefix optional
interface Tournament {}
interface ITournament {} // Also acceptable

// Functions/Methods: camelCase
function calculateRunRate() {}

// Constants: UPPER_SNAKE_CASE
const MAX_OVERS = 20;

// Files: kebab-case
// tournament-service.ts, match-balls.schema.ts
```

### Functions
```typescript
// Use explicit return types
function getMatch(id: string): Promise<Match> {}

// Use arrow functions for callbacks
const matches = tournaments.map((t) => t.matches);

// Async/await over .then()
async function fetchMatches() {
  const response = await api.get('/matches');
  return response.data;
}
```

## NestJS

### Module Structure
```
service-name/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── feature/
│   │   ├── feature.module.ts
│   │   ├── feature.controller.ts
│   │   ├── feature.service.ts
│   │   ├── dto/
│   │   │   ├── create-feature.dto.ts
│   │   │   └── update-feature.dto.ts
│   │   ├── entities/
│   │   │   └── feature.entity.ts
│   │   └── feature.spec.ts
│   └── common/
│       ├── guards/
│       ├── interceptors/
│       └── filters/
```

### DTOs
```typescript
// Always use class-validator
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateMatchDto {
  @IsUUID()
  tournamentId: string;

  @IsUUID()
  teamAId: string;

  @IsUUID()
  teamBId: string;

  @IsOptional()
  @IsString()
  venue?: string;
}
```

## React/Next.js

### Component Structure
```typescript
// Functional components with TypeScript
interface ScoreCardProps {
  match: Match;
  isLive?: boolean;
}

export function ScoreCard({ match, isLive = false }: ScoreCardProps) {
  // Hooks at top
  const [score, setScore] = useState(0);
  
  // Event handlers
  const handleUpdate = useCallback(() => {}, []);
  
  // Effects
  useEffect(() => {}, []);
  
  // Early returns
  if (!match) return null;
  
  // Render
  return <div>...</div>;
}
```

### File Naming
```
components/
├── ScoreCard/
│   ├── index.ts          # Re-export
│   ├── ScoreCard.tsx     # Component
│   ├── ScoreCard.test.tsx
│   └── ScoreCard.module.css
```

## Git

### Branch Names
```
feature/add-wagon-wheel
fix/scoring-calculation-error
refactor/tournament-service
docs/api-documentation
chore/update-dependencies
```

### Commit Messages
```
feat: add ball-by-ball scoring animation
fix: correct run rate calculation for DLS
refactor: extract scoring logic to service
docs: add API endpoint documentation
test: add unit tests for scoring service
chore: upgrade to Next.js 15
```

## Testing

### Unit Tests
- Minimum 80% coverage
- Test file next to source: `feature.spec.ts`
- Use Jest + Testing Library

### E2E Tests
- Critical user journeys
- Use Playwright
- Run in CI before deploy

## API Design

### REST Endpoints
```
GET    /api/v1/tournaments
POST   /api/v1/tournaments
GET    /api/v1/tournaments/:id
PATCH  /api/v1/tournaments/:id
DELETE /api/v1/tournaments/:id

GET    /api/v1/tournaments/:id/matches
POST   /api/v1/tournaments/:id/matches
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```
