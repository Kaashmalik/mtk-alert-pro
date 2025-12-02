export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionTier: 'free' | 'pro' | 'business';
  subscriptionExpiresAt: Date | null;
  fcmToken: string | null;
}

export interface Camera {
  id: string;
  userId: string;
  name: string;
  rtspUrl: string;
  username?: string;
  password?: string;
  isActive: boolean;
  thumbnailUrl?: string;
  detectionSettings: DetectionSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface DetectionSettings {
  person: boolean;
  vehicle: boolean;
  face?: boolean;
  sensitivity: number;
  zones?: DetectionZone[];
}

export interface DetectionZone {
  id: string;
  name: string;
  polygon: { x: number; y: number }[];
  isActive: boolean;
}

export interface Alert {
  id: string;
  cameraId: string;
  userId: string;
  type: 'person' | 'vehicle' | 'face' | 'motion';
  confidence: number;
  snapshotUrl?: string;
  videoClipUrl?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export interface AppSettings {
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  detection: {
    redAlertMode: boolean;
    cooldownSeconds: number;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    streamQuality: '720p' | '1080p';
  };
}

export interface DetectionResult {
  type: 'person' | 'vehicle' | 'face' | 'unknown';
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
