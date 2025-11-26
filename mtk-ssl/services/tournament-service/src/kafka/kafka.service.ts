import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private admin: Admin;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: 'tournament-service',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'tournament-consumer' });
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.logger.log('Connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    this.logger.log('Disconnected from Kafka');
  }

  async publish(topic: string, message: Record<string, unknown>): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id as string || crypto.randomUUID(),
            value: JSON.stringify(message),
            headers: {
              'content-type': 'application/json',
              'timestamp': Date.now().toString(),
            },
          },
        ],
      });
      this.logger.debug(`Published message to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish to ${topic}`, error);
      throw error;
    }
  }

  async subscribe(topic: string, handler: (message: Record<string, unknown>) => Promise<void>): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: false });
    
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const value = message.value?.toString();
          if (value) {
            const parsed = JSON.parse(value);
            await handler(parsed);
          }
        } catch (error) {
          this.logger.error('Failed to process message', error);
        }
      },
    });
  }

  async createTopics(topics: string[]): Promise<void> {
    await this.admin.connect();
    await this.admin.createTopics({
      topics: topics.map(topic => ({
        topic,
        numPartitions: 6,
        replicationFactor: 1,
      })),
    });
    await this.admin.disconnect();
  }
}
