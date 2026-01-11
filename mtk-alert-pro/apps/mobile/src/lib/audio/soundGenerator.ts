/**
 * Sound Generator Utility
 * Generates audio tones programmatically as base64-encoded WAV data
 */

import type { AlarmSoundType } from '@/types';

// Audio generation parameters
const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

/**
 * Generate a sine wave tone as base64-encoded WAV
 */
export function generateTone(
  frequency: number,
  durationMs: number,
  volume: number = 0.5
): string {
  const numSamples = Math.floor((SAMPLE_RATE * durationMs) / 1000);
  const samples = new Int16Array(numSamples);

  const amplitude = Math.floor(32767 * Math.min(1, Math.max(0, volume)));

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = Math.floor(amplitude * Math.sin(2 * Math.PI * frequency * t));
  }

  return createWavBase64(samples);
}

/**
 * Generate an alarm sound with frequency sweep (siren-like)
 */
export function generateSiren(
  startFreq: number,
  endFreq: number,
  durationMs: number,
  volume: number = 0.5
): string {
  const numSamples = Math.floor((SAMPLE_RATE * durationMs) / 1000);
  const samples = new Int16Array(numSamples);

  const amplitude = Math.floor(32767 * Math.min(1, Math.max(0, volume)));

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    // Sweep frequency from start to end
    const currentFreq = startFreq + (endFreq - startFreq) * progress;
    samples[i] = Math.floor(amplitude * Math.sin(2 * Math.PI * currentFreq * t));
  }

  return createWavBase64(samples);
}

/**
 * Generate a beep sequence
 */
export function generateBeepSequence(
  frequency: number,
  beepDurationMs: number,
  pauseDurationMs: number,
  beepCount: number,
  volume: number = 0.5
): string {
  const beepSamples = Math.floor((SAMPLE_RATE * beepDurationMs) / 1000);
  const pauseSamples = Math.floor((SAMPLE_RATE * pauseDurationMs) / 1000);
  const totalSamples = (beepSamples + pauseSamples) * beepCount;
  const samples = new Int16Array(totalSamples);

  const amplitude = Math.floor(32767 * Math.min(1, Math.max(0, volume)));

  let sampleIndex = 0;
  for (let beep = 0; beep < beepCount; beep++) {
    // Generate beep
    for (let i = 0; i < beepSamples; i++) {
      const t = i / SAMPLE_RATE;
      samples[sampleIndex++] = Math.floor(amplitude * Math.sin(2 * Math.PI * frequency * t));
    }
    // Generate pause (silence)
    for (let i = 0; i < pauseSamples; i++) {
      samples[sampleIndex++] = 0;
    }
  }

  return createWavBase64(samples);
}

/**
 * Generate an urgent alarm (alternating high tones)
 */
export function generateUrgentAlarm(volume: number = 0.5): string {
  const numCycles = 4;
  const highFreq = 880;
  const lowFreq = 660;
  const cycleDuration = 200; // ms per tone

  const samplesPerCycle = Math.floor((SAMPLE_RATE * cycleDuration) / 1000);
  const totalSamples = samplesPerCycle * numCycles * 2;
  const samples = new Int16Array(totalSamples);

  const amplitude = Math.floor(32767 * Math.min(1, Math.max(0, volume)));

  let sampleIndex = 0;
  for (let cycle = 0; cycle < numCycles; cycle++) {
    // High tone
    for (let i = 0; i < samplesPerCycle; i++) {
      const t = i / SAMPLE_RATE;
      samples[sampleIndex++] = Math.floor(amplitude * Math.sin(2 * Math.PI * highFreq * t));
    }
    // Low tone
    for (let i = 0; i < samplesPerCycle; i++) {
      const t = i / SAMPLE_RATE;
      samples[sampleIndex++] = Math.floor(amplitude * Math.sin(2 * Math.PI * lowFreq * t));
    }
  }

  return createWavBase64(samples);
}

/**
 * Generate a gentle chime sound
 */
export function generateChime(volume: number = 0.3): string {
  const frequencies = [523, 659, 784]; // C5, E5, G5 - C major chord
  const durationMs = 400;
  const numSamples = Math.floor((SAMPLE_RATE * durationMs) / 1000);
  const samples = new Int16Array(numSamples);

  const amplitude = Math.floor(32767 * Math.min(1, Math.max(0, volume)) / frequencies.length);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Apply envelope (fade out)
    const envelope = 1 - (i / numSamples);
    let sample = 0;

    for (const freq of frequencies) {
      sample += Math.sin(2 * Math.PI * freq * t);
    }

    samples[i] = Math.floor(amplitude * sample * envelope);
  }

  return createWavBase64(samples);
}

/**
 * Create WAV file header and convert samples to base64
 */
function createWavBase64(samples: Int16Array): string {
  const dataLength = samples.length * 2; // 2 bytes per sample (16-bit)
  const fileLength = 44 + dataLength; // Header (44 bytes) + data

  const buffer = new ArrayBuffer(fileLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileLength - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, NUM_CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8), true); // Byte rate
  view.setUint16(32, NUM_CHANNELS * (BITS_PER_SAMPLE / 8), true); // Block align
  view.setUint16(34, BITS_PER_SAMPLE, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return 'data:audio/wav;base64,' + btoa(binary);
}

/**
 * Helper to write string to DataView
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Pre-generated sounds cache
let soundCache: Record<string, string> = {};

/**
 * Get or generate a sound by type
 */
export function getSound(type: AlarmSoundType, volume: number = 0.5): string {
  const cacheKey = `${type}-${volume}`;

  if (soundCache[cacheKey]) {
    return soundCache[cacheKey];
  }

  let sound: string;

  switch (type) {
    case 'urgent':
      sound = generateUrgentAlarm(volume);
      break;
    case 'siren':
      sound = generateSiren(400, 800, 1000, volume);
      break;
    case 'alert':
      sound = generateBeepSequence(660, 200, 100, 3, volume);
      break;
    case 'chime':
      sound = generateChime(volume);
      break;
    case 'beep':
      sound = generateTone(880, 300, volume);
      break;
    case 'heavy':
      // Heavy alarm: intense dual-tone siren with maximum intensity
      sound = generateSiren(300, 1200, 1500, Math.min(1.0, volume * 1.2));
      break;
    default:
      sound = generateTone(440, 200, volume);
  }

  soundCache[cacheKey] = sound;
  return sound;
}

/**
 * Clear the sound cache
 */
export function clearSoundCache(): void {
  soundCache = {};
}
