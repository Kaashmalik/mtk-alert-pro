# Phase 5: Frontend Overhaul (UI/UX, Mobile-First)
**Duration:** Weeks 18-22 (5 weeks)  
**Budget Allocation:** $75,000 (15%)

## 5.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| Atomic Design System | Complete token system |
| WCAG 2.2 AA compliance | 100% accessibility audit pass |
| Dark/Light themes | System preference + toggle |
| Mobile-first responsive | All breakpoints covered |
| PWA implementation | Offline-capable, installable |
| Lighthouse score | > 95 all categories |

## 5.2 Prerequisites

- [ ] Phase 4 backend services stable
- [ ] Design system tokens defined
- [ ] Figma designs approved

## 5.3 Key Activities

### Week 18-19: Design System

```typescript
// packages/ui/design-system/tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#f0fdf4', 500: '#22c55e', 900: '#14532d',
      dark: { 50: '#052e16', 500: '#86efac' },
    },
    cricket: {
      pitch: '#2d5a27',
      ball: '#c41e3a',
      stumps: '#d4a574',
    },
  },
  
  spacing: {
    xs: 'clamp(0.25rem, 0.2rem + 0.5vw, 0.5rem)',
    sm: 'clamp(0.5rem, 0.4rem + 0.75vw, 0.75rem)',
    md: 'clamp(1rem, 0.8rem + 1.25vw, 1.5rem)',
    lg: 'clamp(1.5rem, 1.2rem + 2vw, 2.5rem)',
  },
  
  typography: {
    sizes: {
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
      base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
      xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
      '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
    },
  },
  
  accessibility: {
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
    highContrast: '@media (prefers-contrast: more)',
    minTouchTarget: '44px',
  },
};
```

```css
/* packages/ui/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 142.1 76.2% 36.3%;
    --color-background: 0 0% 100%;
    --color-foreground: 240 10% 3.9%;
    --radius: 0.5rem;
  }
  
  .dark {
    --color-primary: 142.1 70.6% 45.3%;
    --color-background: 240 10% 3.9%;
    --color-foreground: 0 0% 98%;
  }
  
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### Week 20: Component Library

```tsx
// packages/ui/components/cricket/LiveScoreCard.tsx
import { motion, useReducedMotion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface LiveScoreCardProps {
  match: Match;
}

export function LiveScoreCard({ match }: LiveScoreCardProps) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <Card 
      className="relative overflow-hidden bg-gradient-to-br from-cricket-pitch/20 to-green-950/40 backdrop-blur-xl"
      role="region"
      aria-label="Live Match Score"
      aria-live="polite"
    >
      {/* Animated background */}
      {!shouldReduceMotion && (
        <motion.div 
          className="absolute inset-0 bg-gradient-radial"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
      
      {/* Responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6">
        <TeamScore team={match.team1} />
        <div className="text-xl md:text-2xl font-bold text-green-400 text-center">
          VS
        </div>
        <TeamScore team={match.team2} />
      </div>
      
      {/* Live indicator */}
      <Badge 
        variant="live" 
        className="absolute top-4 right-4"
        aria-label="Match is live"
      >
        <span className="sr-only">Status:</span>
        LIVE
      </Badge>
    </Card>
  );
}
```

### Week 21-22: PWA Implementation

```javascript
// apps/web/next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.ssl\.cricket\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 300 },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-image',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
});
```

```json
// apps/web/public/manifest.json
{
  "name": "Shakir Super League",
  "short_name": "SSL",
  "description": "Pakistan's #1 Cricket League Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#22c55e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "screenshots": [
    { "src": "/screenshots/home.png", "sizes": "1280x720", "type": "image/png" }
  ]
}
```

```typescript
// apps/web/src/hooks/useOfflineSync.ts
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<Action[]>([]);
  
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Sync pending actions
      for (const action of pendingActions) {
        await syncAction(action);
      }
      setPendingActions([]);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setIsOnline(false));
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [pendingActions]);
  
  return { isOnline, queueAction: (a) => setPendingActions([...pendingActions, a]) };
}
```

## 5.4 Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 95 |
| Lighthouse Accessibility | 100 |
| Lighthouse PWA | 100 |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.0s |
| Bundle size (gzipped) | < 150KB |

## 5.5 Post-Phase Review Checklist

- [ ] Design system tokens complete
- [ ] All components accessible
- [ ] Dark/Light themes working
- [ ] PWA installable and offline-capable
- [ ] Lighthouse scores achieved
- [ ] Cross-browser testing passed
- [ ] Mobile responsiveness verified
