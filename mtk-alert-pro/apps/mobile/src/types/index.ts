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
  // Detection types - only person and vehicle trigger alerts
  person: boolean;
  vehicle: boolean;
  face?: boolean;
  // Sensitivity threshold (0.0 - 1.0)
  // Higher = fewer false positives but may miss some detections
  sensitivity: number;
  // Notification settings per camera
  notificationsEnabled: boolean;
  alarmEnabled: boolean;
  // Detection zones
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
  thumbnailUrl?: string;
  snapshotUrl?: string;
  videoClipUrl?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// Alarm sound types - each has a unique vibration pattern
export type AlarmSoundType = 'urgent' | 'siren' | 'alert' | 'chime' | 'beep' | 'heavy';

export interface AppSettings {
  notifications: {
    enabled: boolean;
    push: boolean;
    sound: boolean;
    vibration: boolean;
    // Sound settings
    alarmSound: AlarmSoundType;
    alarmVolume: number; // 0.0 to 1.0
    repeatAlarm: boolean;
    repeatCount: number; // -1 for infinite
  };
  detection: {
    redAlertMode: boolean;
    cooldownSeconds: number;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    streamQuality: '720p' | '1080p';
  };
  security: {
    biometricEnabled: boolean;
    autoLock: boolean;
    autoLockTimeout: number; // in seconds
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
