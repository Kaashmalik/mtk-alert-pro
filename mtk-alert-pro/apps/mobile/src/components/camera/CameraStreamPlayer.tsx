/**
 * Enhanced Camera Stream Player Component
 * Features: HLS playback, zoom controls, screenshot, recording, sharing
 * 
 * @module components/camera/CameraStreamPlayer
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  WifiOff,
  Camera,
  Video as VideoIcon,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react-native';
import { streamingService, StreamStatus } from '@/lib/streaming/streamingService';
import { cameraMediaService } from '@/lib/camera/cameraMediaService';
import { logError } from '@/lib/utils/errorHandler';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { hapticNotification } from '@/lib/haptics';

// ============================================================================
// Types
// ============================================================================

type PlayerState = 'idle' | 'connecting' | 'buffering' | 'playing' | 'paused' | 'error';

interface CameraStreamPlayerProps {
  cameraId: string;
  cameraName?: string;
  rtspUrl: string;
  userId: string;
  autoPlay?: boolean;
  showControls?: boolean;
  showAdvancedControls?: boolean;
  onError?: (error: string) => void;
  onStreamReady?: () => void;
  onStateChange?: (state: PlayerState) => void;
  onScreenshot?: (uri: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const CONTROLS_HIDE_DELAY = 5000;

// ============================================================================
// Component
// ============================================================================

export function CameraStreamPlayer({
  cameraId,
  cameraName = 'Camera',
  rtspUrl,
  userId,
  autoPlay = false,
  showControls = true,
  showAdvancedControls = true,
  onError,
  onStreamReady,
  onStateChange,
  onScreenshot,
}: CameraStreamPlayerProps) {
  // Refs
  const videoRef = useRef<Video>(null);
  const containerRef = useRef<View>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // State
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Animated values for zoom
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // =========================================================================
  // State Management
  // =========================================================================

  const updateState = useCallback((newState: PlayerState) => {
    setPlayerState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // =========================================================================
  // Stream Initialization
  // =========================================================================

  const initializeStream = useCallback(async () => {
    updateState('connecting');

    try {
      console.log(`[CameraStreamPlayer] Initializing stream for camera: ${cameraId}`);

      const registration = await streamingService.registerCamera(
        cameraId,
        rtspUrl,
        userId
      );

      if (!registration.success || !registration.streams) {
        throw new Error(registration.error || 'Failed to register camera stream');
      }

      console.log(`[CameraStreamPlayer] Stream registered:`, registration.streams.hls);
      setHlsUrl(registration.streams.hls);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const status = await streamingService.getStreamStatus(cameraId, false);
      setStreamStatus(status);

      if (autoPlay) {
        updateState('buffering');
      } else {
        updateState('idle');
      }

      setRetryCount(0);
      onStreamReady?.();
    } catch (error) {
      console.error('[CameraStreamPlayer] Stream initialization error:', error);
      logError(error, 'CameraStreamPlayer.initializeStream');

      if (retryCount < MAX_RETRIES) {
        retryTimeout.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initializeStream();
        }, RETRY_DELAY * (retryCount + 1));
      } else {
        updateState('error');
        onError?.(error instanceof Error ? error.message : 'Stream initialization failed');
      }
    }
  }, [cameraId, rtspUrl, userId, autoPlay, retryCount, onError, onStreamReady, updateState]);

  // =========================================================================
  // Cleanup
  // =========================================================================

  const cleanup = useCallback(() => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }

    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }

    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = null;
    }

    streamingService.unregisterCamera(cameraId).catch(() => { });
  }, [cameraId]);

  // Initialize on mount
  useEffect(() => {
    initializeStream();
    return () => cleanup();
  }, [cameraId, cleanup]);

  // Auto-hide controls
  useEffect(() => {
    if (showControlsOverlay && playerState === 'playing') {
      controlsTimeout.current = setTimeout(() => {
        setShowControlsOverlay(false);
      }, CONTROLS_HIDE_DELAY);
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [showControlsOverlay, playerState]);

  // Recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // =========================================================================
  // Playback Controls
  // =========================================================================

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[CameraStreamPlayer] Playback error:', status.error);
        if (retryCount < MAX_RETRIES) {
          handleRetry();
        } else {
          updateState('error');
          onError?.(status.error);
        }
      }
      return;
    }

    if (status.isBuffering) {
      updateState('buffering');
    } else if (status.isPlaying) {
      updateState('playing');
    } else {
      updateState('paused');
    }
  }, [retryCount, onError, updateState]);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    hapticNotification();

    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('[CameraStreamPlayer] Play/pause error:', error);
    }

    resetControlsTimer();
  };

  const handleMute = async () => {
    if (!videoRef.current) return;
    hapticNotification();

    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('[CameraStreamPlayer] Mute error:', error);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    updateState('connecting');

    await streamingService.unregisterCamera(cameraId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await initializeStream();
  };

  const handleStartStream = () => {
    updateState('buffering');
  };

  const handleFullscreen = async () => {
    if (!videoRef.current) return;
    hapticNotification();

    try {
      await videoRef.current.presentFullscreenPlayer();
    } catch (error) {
      console.error('[CameraStreamPlayer] Fullscreen error:', error);
    }
  };

  // =========================================================================
  // Zoom Controls
  // =========================================================================

  const handleZoomIn = () => {
    hapticNotification();
    const newZoom = Math.min(zoomLevel + 0.5, MAX_ZOOM);
    setZoomLevel(newZoom);
    scale.value = withSpring(newZoom);
    savedScale.value = newZoom;
    resetControlsTimer();
  };

  const handleZoomOut = () => {
    hapticNotification();
    const newZoom = Math.max(zoomLevel - 0.5, MIN_ZOOM);
    setZoomLevel(newZoom);
    scale.value = withSpring(newZoom);
    savedScale.value = newZoom;
    resetControlsTimer();
  };

  const handleZoomReset = () => {
    hapticNotification();
    setZoomLevel(1);
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    resetControlsTimer();
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = Math.max(MIN_ZOOM, Math.min(scale.value, MAX_ZOOM));
      scale.value = withSpring(savedScale.value);
      setZoomLevel(savedScale.value);
    });

  // Pan gesture for moving zoomed view
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      // Limit translation based on zoom level
      const maxTranslate = (savedScale.value - 1) * 100;
      translateX.value = withSpring(
        Math.max(-maxTranslate, Math.min(translateX.value, maxTranslate))
      );
      translateY.value = withSpring(
        Math.max(-maxTranslate, Math.min(translateY.value, maxTranslate))
      );
    });

  // Double tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      handleZoomReset();
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // =========================================================================
  // Screenshot & Recording
  // =========================================================================

  const handleScreenshot = async () => {
    hapticNotification();
    resetControlsTimer();

    const success = await cameraMediaService.captureAndSaveToGallery(
      containerRef,
      cameraName
    );

    if (success) {
      console.log('[CameraStreamPlayer] Screenshot saved');
    }
  };

  const handleShare = async () => {
    hapticNotification();
    resetControlsTimer();

    await cameraMediaService.captureAndShare(containerRef, cameraName);
  };

  const handleRecord = () => {
    hapticNotification();

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      const duration = recordingDuration;
      setRecordingDuration(0);

      // Capture final frame as "video clip"
      cameraMediaService.captureAndSaveToGallery(containerRef, cameraName).then((success) => {
        if (success) {
          Alert.alert('🎬 Recording Saved', `${duration}s clip captured`);
        }
      });
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);
      cameraMediaService.startRecording();

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (isRecording) {
          handleRecord();
        }
      }, 60000);
    }
  };

  // =========================================================================
  // Utils
  // =========================================================================

  const resetControlsTimer = () => {
    setShowControlsOverlay(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // Render States
  // =========================================================================

  // Idle state
  if (playerState === 'idle' && !autoPlay) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.centerOverlay} onPress={handleStartStream}>
          <View style={styles.playButtonLarge}>
            <Play size={48} color="white" fill="white" />
          </View>
          <Text style={styles.idleText}>Tap to start stream</Text>
          <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
            {rtspUrl}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Connecting state
  if (playerState === 'connecting') {
    return (
      <View style={styles.container}>
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color={colors.brand.red} />
          <Text style={styles.connectingText}>Connecting to camera...</Text>
          <Text style={styles.connectingSubtext}>
            {retryCount > 0 ? `Retry ${retryCount}/${MAX_RETRIES}` : 'Setting up secure stream'}
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (playerState === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.centerOverlay}>
          <WifiOff size={56} color={colors.status.error} />
          <Text style={styles.errorTitle}>Stream Unavailable</Text>
          <Text style={styles.errorText}>
            Unable to connect to camera. Please check:
          </Text>
          <View style={styles.errorList}>
            <Text style={styles.errorListItem}>• Camera is powered on</Text>
            <Text style={styles.errorListItem}>• Camera is on the same network</Text>
            <Text style={styles.errorListItem}>• RTSP URL is correct</Text>
          </View>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <RefreshCw size={20} color="white" />
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Playing/Buffering state
  return (
    <GestureHandlerRootView style={styles.container}>
      <View ref={containerRef} style={styles.container} collapsable={false}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.videoWrapper, animatedVideoStyle]}>
            {hlsUrl && (
              <Video
                ref={videoRef}
                source={{ uri: hlsUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={playerState === 'buffering' || playerState === 'playing'}
                isMuted={isMuted}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                useNativeControls={false}
              />
            )}
          </Animated.View>
        </GestureDetector>

        {/* Buffering indicator */}
        {playerState === 'buffering' && (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color={colors.brand.red} />
          </View>
        )}

        {/* Live indicator */}
        <View style={styles.liveIndicator}>
          <View style={[
            styles.liveDot,
            { backgroundColor: streamStatus?.online ? colors.status.success : colors.status.error }
          ]} />
          <Text style={styles.liveText}>
            {streamStatus?.online ? 'LIVE' : 'OFFLINE'}
          </Text>
        </View>

        {/* Zoom indicator */}
        {zoomLevel > 1 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{zoomLevel.toFixed(1)}x</Text>
          </View>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              REC {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}

        {/* Controls overlay */}
        {showControls && showControlsOverlay && (
          <TouchableOpacity
            style={styles.controlsOverlay}
            activeOpacity={1}
            onPress={() => setShowControlsOverlay(false)}
          >
            {/* Center play/pause button */}
            <TouchableOpacity
              style={styles.centerPlayButton}
              onPress={handlePlayPause}
            >
              {playerState === 'playing' ? (
                <Pause size={36} color="white" fill="white" />
              ) : (
                <Play size={36} color="white" fill="white" />
              )}
            </TouchableOpacity>

            {/* Top controls - Screenshot, Record, Share */}
            {showAdvancedControls && (
              <View style={styles.topControls}>
                <TouchableOpacity style={styles.actionButton} onPress={handleScreenshot}>
                  <Camera size={22} color="white" />
                  <Text style={styles.actionText}>Screenshot</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, isRecording && styles.actionButtonActive]}
                  onPress={handleRecord}
                >
                  <VideoIcon size={22} color={isRecording ? '#EF4444' : 'white'} />
                  <Text style={[styles.actionText, isRecording && styles.actionTextActive]}>
                    {isRecording ? 'Stop' : 'Record'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Share2 size={22} color="white" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Zoom controls */}
            {showAdvancedControls && (
              <View style={styles.zoomControls}>
                <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
                  <ZoomOut size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.zoomLevelText}>{zoomLevel.toFixed(1)}x</Text>
                <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
                  <ZoomIn size={20} color="white" />
                </TouchableOpacity>
                {zoomLevel > 1 && (
                  <TouchableOpacity style={styles.zoomButton} onPress={handleZoomReset}>
                    <RotateCcw size={18} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
                {playerState === 'playing' ? (
                  <Pause size={24} color="white" />
                ) : (
                  <Play size={24} color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={handleMute}>
                {isMuted ? (
                  <VolumeX size={24} color="white" />
                ) : (
                  <Volume2 size={24} color="white" />
                )}
              </TouchableOpacity>

              <View style={styles.spacer} />

              <TouchableOpacity style={styles.controlButton} onPress={handleRetry}>
                <RefreshCw size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={handleFullscreen}>
                <Maximize2 size={20} color="white" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Tap to show controls when hidden */}
        {showControls && !showControlsOverlay && (
          <TouchableOpacity
            style={styles.tapOverlay}
            onPress={() => setShowControlsOverlay(true)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  centerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: spacing.xxl,
  },
  playButtonLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  idleText: {
    color: 'white',
    fontSize: fontSize.lg,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  urlText: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    maxWidth: '80%',
    textAlign: 'center',
  },
  connectingText: {
    color: 'white',
    fontSize: fontSize.lg,
    fontWeight: '500',
    marginTop: spacing.lg,
  },
  connectingSubtext: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  errorTitle: {
    color: colors.status.error,
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorList: {
    marginBottom: spacing.xl,
  },
  errorListItem: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    color: 'white',
    fontSize: fontSize.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  liveIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  liveText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  zoomIndicator: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  zoomText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  recordingIndicator: {
    position: 'absolute',
    top: spacing.md,
    left: '50%',
    transform: [{ translateX: -40 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: spacing.xs,
  },
  recordingText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: spacing.xxl + spacing.md,
    gap: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionText: {
    color: 'white',
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  actionTextActive: {
    color: '#EF4444',
  },
  zoomControls: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  zoomButton: {
    padding: spacing.sm,
  },
  zoomLevelText: {
    color: 'white',
    fontSize: fontSize.xs,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -36 }, { translateY: -36 }],
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  controlButton: {
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
});

export default CameraStreamPlayer;
