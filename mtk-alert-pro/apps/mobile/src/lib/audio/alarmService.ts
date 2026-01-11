/**
 * Alarm Sound Service
 * Manages alarm sounds for security alerts with actual audio playback
 */

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Vibration } from 'react-native';
import { getSound } from './soundGenerator';
import type { AlarmSoundType } from '@/types';

export interface AlarmSound {
  id: AlarmSoundType;
  name: string;
  description: string;
  // Vibration pattern for each sound type (used alongside audio)
  vibrationPattern: number[];
}

export const ALARM_SOUNDS: AlarmSound[] = [
  {
    id: 'urgent',
    name: 'Urgent Alarm',
    description: 'High-priority emergency alarm',
    vibrationPattern: [0, 200, 100, 200, 100, 200, 100, 400],
  },
  {
    id: 'siren',
    name: 'Siren',
    description: 'Alternating siren sound',
    vibrationPattern: [0, 500, 200, 500, 200, 500],
  },
  {
    id: 'alert',
    name: 'Alert',
    description: 'Standard security alert',
    vibrationPattern: [0, 300, 150, 300, 150, 300],
  },
  {
    id: 'chime',
    name: 'Chime',
    description: 'Gentle notification chime',
    vibrationPattern: [0, 100, 100, 100],
  },
  {
    id: 'beep',
    name: 'Beep',
    description: 'Simple beep sound',
    vibrationPattern: [0, 150, 100, 150],
  },
  {
    id: 'heavy',
    name: 'Heavy Alarm',
    description: 'MAXIMUM VOLUME - Intense alarm',
    vibrationPattern: [0, 1000, 200, 1000, 200, 1000],
  },
];

class AlarmService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;
  private repeatInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  /**
   * Initialize the audio system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Play alarm sound with audio and vibration
   */
  async playAlarm(
    soundType: AlarmSoundType = 'alert',
    options: {
      volume?: number;
      repeat?: boolean;
      repeatCount?: number;
    } = {}
  ): Promise<void> {
    const { volume = 0.8, repeat = false, repeatCount = 3 } = options;

    await this.initialize();
    await this.stopAlarm();
    this.isPlaying = true;

    const soundConfig = ALARM_SOUNDS.find(s => s.id === soundType) || ALARM_SOUNDS[2];

    try {
      // Generate and play actual audio
      const audioUri = getSound(soundType, volume);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { volume, shouldPlay: true }
      );

      this.sound = sound;

      // Also vibrate
      Vibration.vibrate(soundConfig.vibrationPattern);

      if (repeat && repeatCount > 0) {
        let playCount = 1;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            if (playCount < repeatCount && this.isPlaying) {
              playCount++;
              sound.replayAsync();
              Vibration.vibrate(soundConfig.vibrationPattern);
            } else {
              this.stopAlarm();
            }
          }
        });
      } else {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.stopAlarm();
          }
        });
      }
    } catch (error) {
      console.error('Failed to play alarm audio:', error);
      // Fallback to vibration only
      Vibration.vibrate(soundConfig.vibrationPattern);
      this.isPlaying = false;
    }
  }

  /**
   * Play a preview of alarm sound (for settings)
   */
  async previewSound(soundType: AlarmSoundType, volume: number = 0.5): Promise<void> {
    await this.initialize();
    await this.stopAlarm();

    const soundConfig = ALARM_SOUNDS.find(s => s.id === soundType) || ALARM_SOUNDS[2];

    try {
      // Generate and play audio preview
      const audioUri = getSound(soundType, volume);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { volume, shouldPlay: true }
      );

      this.sound = sound;

      // Also vibrate
      Vibration.vibrate(soundConfig.vibrationPattern);

      // Auto-cleanup after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          this.sound = null;
        }
      });
    } catch (error) {
      console.error('Failed to preview sound:', error);
      // Fallback to vibration only
      Vibration.vibrate(soundConfig.vibrationPattern);
    }
  }

  /**
   * Stop the alarm
   */
  async stopAlarm(): Promise<void> {
    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }

    // Cancel any ongoing vibration
    Vibration.cancel();

    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {
        // Ignore errors on cleanup
      }
      this.sound = null;
    }

    this.isPlaying = false;
  }

  /**
   * Check if alarm is currently playing
   */
  isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set volume (0.0 to 1.0) - placeholder for future audio implementation
   */
  async setVolume(_volume: number): Promise<void> {
    // Volume control will work when actual audio files are added
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopAlarm();
    this.initialized = false;
  }
}

// Export singleton instance
export const alarmService = new AlarmService();

// Export convenience functions
export const playAlarm = alarmService.playAlarm.bind(alarmService);
export const stopAlarm = alarmService.stopAlarm.bind(alarmService);
export const previewSound = alarmService.previewSound.bind(alarmService);
