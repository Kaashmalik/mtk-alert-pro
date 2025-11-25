# Phase 6: Animations and Performance Optimizations
**Duration:** Weeks 23-26 (4 weeks)  
**Budget Allocation:** $50,000 (10%)

## 6.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| Page transitions | Smooth app-like navigation |
| Cricket animations | Ball trajectory, wicket fall |
| Web Vitals 2025 | INP < 200ms, FCP < 1.5s |
| Bundle optimization | < 150KB gzipped |
| Real-time performance | WebSocket latency < 100ms |
| Carbon-aware computing | Green hosting metrics |

## 6.2 Prerequisites

- [ ] Phase 5 UI/UX complete
- [ ] Design system implemented
- [ ] Performance baseline established

## 6.3 Key Activities

### Week 23: Page Transitions

```tsx
// apps/web/src/components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

const variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  
  if (shouldReduceMotion) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={router.asPath}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Week 24: Cricket Animations

```tsx
// packages/ui/components/cricket/BallTrajectory.tsx
import { useRef, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface BallTrajectoryProps {
  shotType: 'cover-drive' | 'pull' | 'cut' | 'sweep' | 'six';
  runs: number;
  onComplete?: () => void;
}

export function BallTrajectory({ shotType, runs, onComplete }: BallTrajectoryProps) {
  const shouldReduceMotion = useReducedMotion();
  
  // Get trajectory path based on shot type
  const trajectory = getTrajectoryPath(shotType);
  
  const progress = useSpring(0, { stiffness: 50, damping: 20 });
  const x = useTransform(progress, [0, 1], [trajectory.start.x, trajectory.end.x]);
  const y = useTransform(progress, [0, 1], trajectory.yPath);
  
  useEffect(() => {
    if (!shouldReduceMotion) {
      progress.set(1);
    }
  }, [progress, shouldReduceMotion]);
  
  if (shouldReduceMotion) {
    return <StaticBallResult runs={runs} />;
  }
  
  return (
    <svg className="w-full h-64" viewBox="0 0 400 200">
      {/* Cricket pitch background */}
      <rect x="150" y="80" width="100" height="120" fill="#2d5a27" rx="4" />
      
      {/* Trajectory path */}
      <motion.circle
        cx={x}
        cy={y}
        r="8"
        fill="#c41e3a"
        onAnimationComplete={onComplete}
      />
      
      {/* Boundary indicator for 4s and 6s */}
      {runs >= 4 && (
        <motion.text
          x={trajectory.end.x}
          y={trajectory.end.y - 20}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl font-bold fill-yellow-400"
        >
          {runs === 6 ? '🎆 SIX!' : '4️⃣ FOUR!'}
        </motion.text>
      )}
    </svg>
  );
}

// Wicket fall animation with haptic feedback
export function WicketFallAnimation({ onComplete }: { onComplete?: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  
  useEffect(() => {
    // Haptic feedback on mobile
    if ('vibrate' in navigator && !shouldReduceMotion) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [shouldReduceMotion]);
  
  return (
    <motion.div
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, -15, 10, -5, 90] }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    >
      <StumpsIcon className="w-16 h-24 text-amber-600" />
    </motion.div>
  );
}
```

### Week 25: Performance Optimization

```typescript
// apps/web/next.config.js - Code splitting
module.exports = {
  experimental: {
    optimizePackageImports: ['@ssl/ui', 'framer-motion', 'recharts'],
  },
  
  webpack: (config, { isServer }) => {
    // Tree shaking
    config.optimization.usedExports = true;
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(new BundleAnalyzerPlugin());
    }
    
    return config;
  },
};
```

```tsx
// apps/web/src/components/LazyComponents.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
export const WagonWheel = dynamic(
  () => import('@ssl/ui/components/cricket/WagonWheel'),
  { loading: () => <WagonWheelSkeleton />, ssr: false }
);

export const Manhattan = dynamic(
  () => import('@ssl/ui/components/cricket/Manhattan'),
  { loading: () => <ManhattanSkeleton />, ssr: false }
);

export const LiveStream = dynamic(
  () => import('@ssl/ui/components/streaming/LiveStream'),
  { loading: () => <StreamSkeleton />, ssr: false }
);
```

### Week 26: Real-time Optimization

```typescript
// packages/socket/src/optimized-client.ts
import { io, Socket } from 'socket.io-client';

export class OptimizedSocketClient {
  private socket: Socket;
  private messageQueue: Map<string, any> = new Map();
  private flushInterval: number = 50; // ms
  
  constructor(url: string) {
    this.socket = io(url, {
      transports: ['websocket'], // Skip polling
      upgrade: false,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    // Batch messages
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  emit(event: string, data: any) {
    // Deduplicate rapid updates
    this.messageQueue.set(event, data);
  }
  
  private flush() {
    if (this.messageQueue.size === 0) return;
    
    this.messageQueue.forEach((data, event) => {
      this.socket.emit(event, data);
    });
    
    this.messageQueue.clear();
  }
}
```

```typescript
// WebTransport for lower latency (future)
// apps/web/src/lib/webtransport.ts
export async function createWebTransportConnection(url: string) {
  if (!('WebTransport' in window)) {
    console.warn('WebTransport not supported, falling back to WebSocket');
    return null;
  }
  
  const transport = new WebTransport(url);
  await transport.ready;
  
  return {
    send: async (data: Uint8Array) => {
      const writer = transport.datagrams.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
    },
    receive: async function* () {
      const reader = transport.datagrams.readable.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        yield value;
      }
    },
  };
}
```

## 6.4 Carbon-Aware Sustainability

```typescript
// apps/web/src/lib/carbon-aware.ts
export async function getCarbonIntensity(region: string) {
  const response = await fetch(
    `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${region}`
  );
  return response.json();
}

export function adjustForCarbonIntensity(intensity: number) {
  // Reduce animations during high carbon periods
  if (intensity > 500) {
    return {
      reduceAnimations: true,
      useCompressedImages: true,
      deferNonCritical: true,
    };
  }
  return {
    reduceAnimations: false,
    useCompressedImages: false,
    deferNonCritical: false,
  };
}
```

## 6.5 Success Metrics

| Metric | Target |
|--------|--------|
| INP (Interaction to Next Paint) | < 200ms |
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.0s |
| CLS (Cumulative Layout Shift) | < 0.05 |
| TTI (Time to Interactive) | < 3.0s |
| Bundle size | < 150KB gzipped |
| WebSocket latency | < 100ms |

## 6.6 Post-Phase Review Checklist

- [ ] Page transitions smooth
- [ ] Cricket animations working
- [ ] Reduced motion support verified
- [ ] Web Vitals targets achieved
- [ ] Bundle size optimized
- [ ] Real-time latency acceptable
- [ ] Carbon metrics tracked
