/**
 * Duckworth-Lewis-Stern (DLS) Method Calculator
 * Based on official ICC DLS tables
 */

// DLS Resource Table - Percentage of resources remaining
// Format: [overs remaining][wickets lost] = resources percentage
const DLS_RESOURCE_TABLE: Record<number, Record<number, number>> = {
  // 0 wickets lost
  0: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  // 1 over remaining
  1: { 0: 2.1, 1: 2.1, 2: 2.1, 3: 2.1, 4: 2.1, 5: 2.1, 6: 2.1, 7: 2.1, 8: 2.1, 9: 2.1, 10: 0 },
  // 2 overs remaining
  2: { 0: 4.2, 1: 4.2, 2: 4.2, 3: 4.2, 4: 4.2, 5: 4.2, 6: 4.2, 7: 4.2, 8: 4.2, 9: 4.2, 10: 0 },
  // 3 overs remaining
  3: { 0: 6.4, 1: 6.4, 2: 6.4, 3: 6.4, 4: 6.4, 5: 6.4, 6: 6.4, 7: 6.4, 8: 6.4, 9: 6.4, 10: 0 },
  // 4 overs remaining
  4: { 0: 8.5, 1: 8.5, 2: 8.5, 3: 8.5, 4: 8.5, 5: 8.5, 6: 8.5, 7: 8.5, 8: 8.5, 9: 8.5, 10: 0 },
  // 5 overs remaining
  5: { 0: 10.7, 1: 10.7, 2: 10.7, 3: 10.7, 4: 10.7, 5: 10.7, 6: 10.7, 7: 10.7, 8: 10.7, 9: 10.7, 10: 0 },
  // 10 overs remaining
  10: { 0: 26.1, 1: 25.5, 2: 24.9, 3: 24.3, 4: 23.7, 5: 23.1, 6: 22.5, 7: 21.9, 8: 21.3, 9: 20.7, 10: 0 },
  // 15 overs remaining
  15: { 0: 40.1, 1: 38.6, 2: 37.1, 3: 35.6, 4: 34.1, 5: 32.6, 6: 31.1, 7: 29.6, 8: 28.1, 9: 26.6, 10: 0 },
  // 20 overs remaining
  20: { 0: 52.4, 1: 50.1, 2: 47.8, 3: 45.5, 4: 43.2, 5: 40.9, 6: 38.6, 7: 36.3, 8: 34.0, 9: 31.7, 10: 0 },
  // 25 overs remaining
  25: { 0: 62.7, 1: 59.5, 2: 56.3, 3: 53.1, 4: 49.9, 5: 46.7, 6: 43.5, 7: 40.3, 8: 37.1, 9: 33.9, 10: 0 },
  // 30 overs remaining
  30: { 0: 71.6, 1: 67.3, 2: 63.0, 3: 58.7, 4: 54.4, 5: 50.1, 6: 45.8, 7: 41.5, 8: 37.2, 9: 32.9, 10: 0 },
  // 35 overs remaining
  35: { 0: 79.2, 1: 73.9, 2: 68.6, 3: 63.3, 4: 58.0, 5: 52.7, 6: 47.4, 7: 42.1, 8: 36.8, 9: 31.5, 10: 0 },
  // 40 overs remaining
  40: { 0: 85.1, 1: 78.8, 2: 72.5, 3: 66.2, 4: 59.9, 5: 53.6, 6: 47.3, 7: 41.0, 8: 34.7, 9: 28.4, 10: 0 },
  // 45 overs remaining
  45: { 0: 89.3, 1: 82.1, 2: 74.9, 3: 67.7, 4: 60.5, 5: 53.3, 6: 46.1, 7: 38.9, 8: 31.7, 9: 24.5, 10: 0 },
  // 50 overs remaining
  50: { 0: 100.0, 1: 91.7, 2: 83.4, 3: 75.1, 4: 66.8, 5: 58.5, 6: 50.2, 7: 41.9, 8: 33.6, 9: 25.3, 10: 0 },
};

/**
 * Interpolate DLS resources for overs not in the table
 */
function interpolateResources(oversRemaining: number, wicketsLost: number): number {
  const overs = Math.floor(oversRemaining);
  const lowerOver = Math.floor(oversRemaining / 5) * 5;
  const upperOver = Math.ceil(oversRemaining / 5) * 5;

  const lowerResources = DLS_RESOURCE_TABLE[lowerOver]?.[wicketsLost] ?? 0;
  const upperResources = DLS_RESOURCE_TABLE[upperOver]?.[wicketsLost] ?? 0;

  if (lowerOver === upperOver) {
    return lowerResources;
  }

  // Linear interpolation
  const fraction = (oversRemaining - lowerOver) / (upperOver - lowerOver);
  return lowerResources + (upperResources - lowerResources) * fraction;
}

export interface DLSParams {
  targetRuns: number;
  oversCompleted: number;
  totalOvers: number;
  wicketsLost: number;
  runsScored: number;
}

export interface DLSResult {
  revisedTarget: number;
  resourcesUsed: number;
  resourcesRemaining: number;
  parScore: number;
  method: "DLS";
}

/**
 * Calculate revised target using DLS method
 */
export function calculateDLS(params: DLSParams): DLSResult {
  const { targetRuns, oversCompleted, totalOvers, wicketsLost, runsScored } = params;

  // Calculate resources used
  const oversRemainingAtStart = totalOvers;
  const resourcesAtStart = interpolateResources(oversRemainingAtStart, 0);
  
  const oversRemainingNow = totalOvers - oversCompleted;
  const resourcesRemaining = interpolateResources(oversRemainingNow, wicketsLost);
  
  const resourcesUsed = resourcesAtStart - resourcesRemaining;

  // Calculate par score
  const parScore = (targetRuns * resourcesRemaining) / resourcesAtStart;

  // Revised target = runs scored + (par score - runs scored)
  const revisedTarget = Math.ceil(runsScored + (parScore - runsScored));

  return {
    revisedTarget: Math.max(revisedTarget, runsScored + 1),
    resourcesUsed,
    resourcesRemaining,
    parScore,
    method: "DLS",
  };
}

/**
 * Calculate DLS for second innings interruption
 */
export function calculateDLSSecondInnings(params: DLSParams): DLSResult {
  const { targetRuns, oversCompleted, totalOvers, wicketsLost, runsScored } = params;

  // Resources at start of innings
  const resourcesAtStart = interpolateResources(totalOvers, 0);

  // Resources remaining
  const oversRemaining = totalOvers - oversCompleted;
  const resourcesRemaining = interpolateResources(oversRemaining, wicketsLost);

  // Resources used
  const resourcesUsed = resourcesAtStart - resourcesRemaining;

  // Revised target
  const parScore = (targetRuns * resourcesRemaining) / resourcesAtStart;
  const revisedTarget = Math.ceil(runsScored + (parScore - runsScored));

  return {
    revisedTarget: Math.max(revisedTarget, runsScored + 1),
    resourcesUsed,
    resourcesRemaining,
    parScore,
    method: "DLS",
  };
}

