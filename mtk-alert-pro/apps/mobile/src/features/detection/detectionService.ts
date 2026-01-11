/**
 * 🔒 MEMORY SAFE: Detection Service
 * Simplified version focused on memory safety
 */
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { logError } from '@/lib/utils/errorHandler';
import type { DetectionResult } from '@/types';

const DETECTION_CONFIG = {
  inputSize: 320,
  scoreThreshold: 0.65,
  maxDetections: 10,
  typeThresholds: {
    person: 0.6,
    vehicle: 0.65,
  },
} as const;

const DETECTION_CLASSES: Record<number, 'person' | 'vehicle'> = {
  0: 'person',
  2: 'vehicle',
  3: 'vehicle',
  5: 'vehicle',
  7: 'vehicle',
  1: 'vehicle',
  6: 'vehicle',
  8: 'vehicle',
};

class DetectionService {
  private model: tf.GraphModel | null = null;
  private isReady = false;
  private isProcessing = false;
  private initPromise: Promise<void> | null = null;
  private lastProcessTime = 0;

  async initialize(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('[DetectionService] Initializing TensorFlow.js...');
      await tf.ready();

      // Try WebGL backend, fallback to CPU
      if (tf.getBackend() !== 'rn-webgl') {
        try {
          await tf.setBackend('rn-webgl');
        } catch {
          console.log('[DetectionService] Using CPU backend');
        }
      }

      // Load model
      this.model = await tf.loadGraphModel(
        'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1',
        { fromTFHub: true },
      );

      console.log('[DetectionService] Model loaded successfully');
      this.isReady = true;
    } catch (error) {
      console.error('[DetectionService] Initialization failed:', error);
      logError(error, 'DetectionService.initialize');
      this.initPromise = null;
      throw error;
    }
  }

  async detect(imageUri: string): Promise<DetectionResult[]> {
    if (!this.isReady || !this.model) {
      console.warn('[DetectionService] Service not initialized');
      return [];
    }

    if (this.isProcessing) {
      console.log('[DetectionService] Already processing, skipping...');
      return [];
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // 🔒 MEMORY SAFE: Load and process image
      const imageBuffer = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = tf.util.encodeString(imageBuffer, 'base64');
      const rawImage = decodeJpeg(new Uint8Array(buffer.buffer));

      const resized = tf.image.resizeBilinear(rawImage, [
        DETECTION_CONFIG.inputSize,
        DETECTION_CONFIG.inputSize,
      ]);
      rawImage.dispose();

      const normalized = resized.div(255.0);
      resized.dispose();

      const batched = normalized.expandDims(0);
      normalized.dispose();

      // Run inference
      const predictions = (await this.model.executeAsync(
        batched,
      )) as tf.Tensor[];
      batched.dispose();

      // Parse predictions
      const results = await this._parsePredictions(predictions);

      // Clean up prediction tensors
      predictions.forEach((t) => t.dispose());

      this.lastProcessTime = Date.now() - startTime;
      console.log(
        `[DetectionService] Detection completed in ${this.lastProcessTime}ms, found ${results.length} objects`,
      );

      return results;
    } catch (error) {
      console.error('[DetectionService] Detection failed:', error);
      logError(error, 'DetectionService.detect');
      return [];
    } finally {
      this.isProcessing = false;

      // 🔒 MEMORY SAFE: Cleanup any remaining tensors
      const numTensors = tf.memory().numTensors;
      if (numTensors > 0) {
        console.warn(
          `[DetectionService] Cleaning up ${numTensors} remaining tensors`,
        );
        tf.disposeVariables();
      }
    }
  }

  private async _parsePredictions(
    predictions: tf.Tensor[],
  ): Promise<DetectionResult[]> {
    const [boxesTensor, classesTensor, scoresTensor, numDetectionsTensor] =
      predictions;

    const boxes = (await boxesTensor.array()) as number[][][];
    const classes = (await classesTensor.array()) as number[][];
    const scores = (await scoresTensor.array()) as number[][];
    const numDetections = await numDetectionsTensor.data();

    const results: DetectionResult[] = [];
    const count = Math.min(
      Math.round(numDetections[0]),
      DETECTION_CONFIG.maxDetections,
    );

    for (let i = 0; i < count; i++) {
      const classId = Math.round(classes[0][i]);
      const score = scores[0][i];

      if (!(classId in DETECTION_CLASSES)) continue;

      const detectionType = DETECTION_CLASSES[classId];
      const threshold =
        DETECTION_CONFIG.typeThresholds[detectionType] ||
        DETECTION_CONFIG.scoreThreshold;

      if (score < threshold) continue;

      const [y1, x1, y2, x2] = boxes[0][i];

      results.push({
        type: detectionType,
        confidence: score,
        boundingBox: {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        },
      });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  isInitialized(): boolean {
    return this.isReady;
  }

  isBusy(): boolean {
    return this.isProcessing;
  }

  getLastProcessTime(): number {
    return this.lastProcessTime;
  }

  async dispose(): Promise<void> {
    console.log('[DetectionService] Disposing...');

    if (this.model) {
      this.model.dispose();
      this.model = null;
    }

    this.isReady = false;
    this.initPromise = null;

    // 🔒 MEMORY SAFE: Clean up any remaining tensors
    const numTensors = tf.memory().numTensors;
    if (numTensors > 0) {
      console.log(
        `[DetectionService] Cleaning up ${numTensors} remaining tensors`,
      );
      tf.disposeVariables();
    }

    console.log('[DetectionService] Disposed');
  }
}

export const detectionService = new DetectionService();
export { DetectionService };
