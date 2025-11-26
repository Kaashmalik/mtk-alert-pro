import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');
    
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
        this.logger.log('Firebase Admin initialized');
      } catch (error) {
        this.logger.warn('Failed to initialize Firebase Admin', error);
      }
    } else {
      this.logger.warn('Firebase credentials not configured - push notifications in mock mode');
    }
  }

  async sendToUser(userId: string, message: PushMessage): Promise<boolean> {
    if (!this.initialized) {
      this.logger.log(`[MOCK] Push to user ${userId}: ${message.title}`);
      return true;
    }

    try {
      // In production, fetch user's FCM tokens from database
      const tokens = await this.getUserTokens(userId);
      
      if (tokens.length === 0) {
        this.logger.warn(`No push tokens found for user ${userId}`);
        return false;
      }

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: message.title,
          body: message.body,
          imageUrl: message.imageUrl,
        },
        data: message.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'ssl_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      this.logger.log(`Push sent to ${response.successCount}/${tokens.length} devices`);
      return response.successCount > 0;
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
      return false;
    }
  }

  async sendToTopic(topic: string, message: PushMessage): Promise<boolean> {
    if (!this.initialized) {
      this.logger.log(`[MOCK] Push to topic ${topic}: ${message.title}`);
      return true;
    }

    try {
      const response = await admin.messaging().send({
        topic: topic.replace(/[^a-zA-Z0-9_-]/g, '_'),
        notification: {
          title: message.title,
          body: message.body,
          imageUrl: message.imageUrl,
        },
        data: message.data,
        android: {
          priority: 'high',
        },
      });

      this.logger.log(`Push sent to topic ${topic}: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push to topic ${topic}`, error);
      return false;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    if (!this.initialized) return true;

    try {
      await admin.messaging().subscribeToTopic(tokens, topic);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}`, error);
      return false;
    }
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    // In production, fetch from database
    // For now, return empty to use topic-based messaging
    return [];
  }
}
