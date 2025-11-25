# Phase 9: AI/ML Integration and DevEx Improvements
**Duration:** Weeks 35-38 (4 weeks)  
**Budget Allocation:** $50,000 (10%)

## 9.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| AI Commentary | Real-time Urdu/English generation |
| Win Predictions | 85% accuracy on test data |
| Personalization | User-specific feed recommendations |
| Auto-highlights | Video analysis pipeline |
| DevEx improvements | Build time < 2 min, DX score > 80 |

## 9.2 Prerequisites

- [ ] Phase 8 security complete
- [ ] AI/ML infrastructure ready
- [ ] Training data prepared

## 9.3 Key Activities

### Week 35: AI Commentary Service

```typescript
// services/ai-commentary-service/src/commentary.service.ts
import OpenAI from 'openai';
import { Kafka } from 'kafkajs';

interface BallEvent {
  matchId: string;
  over: number;
  ball: number;
  runs: number;
  batsman: string;
  bowler: string;
  shotType?: string;
  wicket?: { type: string; player: string };
}

export class AICommentaryService {
  private openai: OpenAI;
  private kafka: Kafka;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async generateCommentary(event: BallEvent, language: 'en' | 'ur' = 'en'): Promise<string> {
    const context = await this.getMatchContext(event.matchId);
    
    const systemPrompt = language === 'ur' 
      ? `You are an expert cricket commentator providing exciting Urdu commentary. 
         Use cricket terminology in Urdu. Be enthusiastic and engaging.`
      : `You are an expert cricket commentator providing exciting English commentary.
         Use vivid descriptions and cricket terminology. Be enthusiastic.`;
    
    const userPrompt = this.buildPrompt(event, context);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });
    
    return response.choices[0].message.content;
  }
  
  private buildPrompt(event: BallEvent, context: MatchContext): string {
    let prompt = `Match situation: ${context.team1} ${context.score1} vs ${context.team2} ${context.score2}.
Over ${event.over}.${event.ball}: ${event.bowler} to ${event.batsman}.`;
    
    if (event.wicket) {
      prompt += ` WICKET! ${event.wicket.player} is ${event.wicket.type}!`;
    } else if (event.runs === 6) {
      prompt += ` SIX! ${event.shotType || 'Massive hit'} over the boundary!`;
    } else if (event.runs === 4) {
      prompt += ` FOUR! ${event.shotType || 'Beautiful shot'} to the boundary!`;
    } else {
      prompt += ` ${event.runs} run(s). ${event.shotType || ''}`;
    }
    
    prompt += `\n\nGenerate exciting commentary for this moment (2-3 sentences):`;
    
    return prompt;
  }
  
  // Stream commentary via Kafka
  async streamCommentary(matchId: string) {
    const consumer = this.kafka.consumer({ groupId: 'commentary-consumer' });
    await consumer.subscribe({ topic: 'ssl.scoring.ball-events' });
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value.toString());
        
        if (event.matchId === matchId) {
          const [enCommentary, urCommentary] = await Promise.all([
            this.generateCommentary(event, 'en'),
            this.generateCommentary(event, 'ur'),
          ]);
          
          // Publish to commentary topic
          await this.kafka.producer().send({
            topic: 'ssl.commentary',
            messages: [{
              key: matchId,
              value: JSON.stringify({
                matchId,
                ballId: `${event.over}.${event.ball}`,
                en: enCommentary,
                ur: urCommentary,
                timestamp: Date.now(),
              }),
            }],
          });
        }
      },
    });
  }
}
```

### Week 36: Win Predictions

```typescript
// services/analytics-service/src/ml/predictions.ts
import * as tf from '@tensorflow/tfjs-node';

export class WinPredictionModel {
  private model: tf.LayersModel;
  
  async load() {
    this.model = await tf.loadLayersModel('file://./models/win-prediction/model.json');
  }
  
  async predict(matchState: MatchState): Promise<PredictionResult> {
    const features = this.extractFeatures(matchState);
    const tensor = tf.tensor2d([features]);
    
    const prediction = this.model.predict(tensor) as tf.Tensor;
    const probabilities = await prediction.data();
    
    return {
      team1WinProbability: probabilities[0],
      team2WinProbability: probabilities[1],
      confidence: Math.abs(probabilities[0] - probabilities[1]),
      factors: this.explainPrediction(features, probabilities),
    };
  }
  
  private extractFeatures(state: MatchState): number[] {
    return [
      // Current state
      state.currentScore / state.targetScore,
      state.wicketsLost / 10,
      state.oversRemaining / state.totalOvers,
      state.currentRunRate,
      state.requiredRunRate,
      
      // Historical performance
      state.team1HistoricalWinRate,
      state.team2HistoricalWinRate,
      state.headToHeadWinRate,
      
      // Player factors
      state.currentBatsmanAverage,
      state.currentBatsmanStrikeRate,
      state.currentBowlerEconomy,
      state.currentBowlerStrikeRate,
      
      // Match conditions
      state.isPowerplay ? 1 : 0,
      state.isDeathOvers ? 1 : 0,
      state.venueHistoricalFirstBatWinRate,
    ];
  }
  
  private explainPrediction(features: number[], probs: Float32Array): string[] {
    const factors = [];
    
    if (features[4] > 10) { // Required run rate > 10
      factors.push('High required run rate favoring bowling team');
    }
    if (features[1] > 0.5) { // More than 5 wickets lost
      factors.push('Batting team under pressure with wickets lost');
    }
    if (features[0] > 0.7) { // Close to target
      factors.push('Batting team approaching target');
    }
    
    return factors;
  }
}

// Training pipeline (runs offline)
export async function trainModel(trainingData: MatchData[]) {
  const { features, labels } = prepareTrainingData(trainingData);
  
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [15] }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 2, activation: 'softmax' }),
    ],
  });
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  await model.fit(features, labels, {
    epochs: 100,
    validationSplit: 0.2,
    callbacks: tf.callbacks.earlyStopping({ patience: 10 }),
  });
  
  await model.save('file://./models/win-prediction');
}
```

### Week 37: Personalization Engine

```typescript
// services/analytics-service/src/personalization/recommendation.ts
export class PersonalizationEngine {
  private readonly db: Database;
  private readonly redis: Redis;
  
  async getPersonalizedFeed(userId: string): Promise<FeedItem[]> {
    // Get user preferences
    const preferences = await this.getUserPreferences(userId);
    
    // Get user interactions
    const interactions = await this.getUserInteractions(userId);
    
    // Calculate user embedding
    const userEmbedding = await this.calculateUserEmbedding(preferences, interactions);
    
    // Find similar content using pgvector
    const recommendations = await this.db.query(`
      SELECT 
        c.id,
        c.type,
        c.title,
        c.metadata,
        1 - (c.embedding <=> $1::vector) as similarity
      FROM content c
      WHERE c.tenant_id = $2
        AND c.created_at > NOW() - INTERVAL '7 days'
        AND c.id NOT IN (SELECT content_id FROM user_interactions WHERE user_id = $3)
      ORDER BY similarity DESC
      LIMIT 50
    `, [userEmbedding, preferences.tenantId, userId]);
    
    // Apply diversity and freshness boosting
    return this.diversifyResults(recommendations, preferences);
  }
  
  private async calculateUserEmbedding(
    preferences: UserPreferences,
    interactions: UserInteraction[]
  ): Promise<number[]> {
    // Weighted combination of:
    // - Favorite teams embeddings
    // - Favorite players embeddings
    // - Interacted content embeddings
    // - Explicit preferences
    
    const teamEmbeddings = await this.getTeamEmbeddings(preferences.favoriteTeams);
    const playerEmbeddings = await this.getPlayerEmbeddings(preferences.favoritePlayers);
    const contentEmbeddings = await this.getContentEmbeddings(
      interactions.map(i => i.contentId)
    );
    
    // Weighted average
    return this.weightedAverage([
      { embedding: teamEmbeddings, weight: 0.3 },
      { embedding: playerEmbeddings, weight: 0.3 },
      { embedding: contentEmbeddings, weight: 0.4 },
    ]);
  }
}
```

### Week 38: Developer Experience

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"],
      "cache": false
    }
  },
  "remoteCache": {
    "signature": true
  }
}
```

```yaml
# .github/workflows/ci.yaml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      # Turborepo remote cache
      - uses: dtinth/setup-github-actions-caching-for-turbo@v1
      
      - run: pnpm install --frozen-lockfile
      
      # Only run affected
      - run: pnpm turbo run lint test build --filter="...[origin/main]"
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

```typescript
// packages/config/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
});
```

## 9.4 Success Metrics

| Metric | Target |
|--------|--------|
| AI commentary latency | < 2s |
| Prediction accuracy | > 85% |
| Personalization CTR | > 15% |
| Build time | < 2 min |
| Test coverage | 80% |
| DX satisfaction | > 80% |

## 9.5 Post-Phase Review Checklist

- [ ] AI commentary generating in both languages
- [ ] Win prediction model deployed
- [ ] Personalization engine operational
- [ ] DevEx improvements measured
- [ ] CI/CD optimized
- [ ] Documentation updated
