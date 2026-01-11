import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  AlertCircle,
} from 'lucide-react-native';
import { designSystem } from '@/theme/design-system';

interface VideoPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onError?: (error: string) => void;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

export function VideoPlayer({
  source,
  poster,
  autoPlay = false,
  showControls = true,
  onError,
  onPlaybackStatusUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const isMuted = status?.isLoaded ? status.isMuted : false;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis || 0 : 0;

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControlsOverlay(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControlsOverlay(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);

    if (playbackStatus.isLoaded) {
      setIsLoading(false);
      setError(null);
    }

    if (!playbackStatus.isLoaded && playbackStatus.error) {
      setError(playbackStatus.error);
      onError?.(playbackStatus.error);
    }

    onPlaybackStatusUpdate?.(playbackStatus);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
    onError?.(errorMessage);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    resetControlsTimeout();

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    resetControlsTimeout();
    await videoRef.current.setIsMutedAsync(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;
    resetControlsTimeout();

    if (isFullscreen) {
      await videoRef.current.dismissFullscreenPlayer();
    } else {
      await videoRef.current.presentFullscreenPlayer();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleRetry = async () => {
    setError(null);
    setIsLoading(true);
    if (videoRef.current) {
      await videoRef.current.unloadAsync();
      await videoRef.current.loadAsync({ uri: source }, {}, false);
    }
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={resetControlsTimeout}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef as any}
          source={{ uri: source }}
          posterSource={poster ? { uri: poster } : undefined}
          usePoster={!!poster}
          posterStyle={styles.poster}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay}
          isLooping={false}
          isMuted={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoadStart={handleLoadStart}
          onError={(e) => handleError(String(e) || 'Failed to load video')}
          useNativeControls={false}
        />

        {/* Loading Indicator */}
        {isLoading && !error && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={designSystem.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading stream...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.overlay}>
            <AlertCircle size={48} color={designSystem.colors.status.danger} />
            <Text style={styles.errorText}>Failed to load video</Text>
            <Text style={styles.errorDetail}>{error}</Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <RotateCcw size={20} color="white" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && showControlsOverlay && !isLoading && !error && (
          <View style={styles.controlsOverlay}>
            {/* Top Gradient */}
            <View style={styles.topGradient} />

            {/* Center Play/Pause */}
            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.centerPlayButton}
            >
              {isPlaying ? (
                <Pause size={40} color="white" fill="white" />
              ) : (
                <Play size={40} color="white" fill="white" />
              )}
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                  />
                </View>
                <Text style={styles.timeText}>
                  {formatTime(position)} / {formatTime(duration)}
                </Text>
              </View>

              {/* Control Buttons */}
              <View style={styles.controlButtons}>
                <TouchableOpacity onPress={togglePlayPause} style={styles.controlBtn}>
                  {isPlaying ? (
                    <Pause size={24} color="white" />
                  ) : (
                    <Play size={24} color="white" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleMute} style={styles.controlBtn}>
                  {isMuted ? (
                    <VolumeX size={24} color="white" />
                  ) : (
                    <Volume2 size={24} color="white" />
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity onPress={toggleFullscreen} style={styles.controlBtn}>
                  {isFullscreen ? (
                    <Minimize2 size={24} color="white" />
                  ) : (
                    <Maximize2 size={24} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  poster: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: designSystem.typography.size.base,
    marginTop: designSystem.spacing.md,
  },
  errorText: {
    color: designSystem.colors.status.danger,
    fontSize: designSystem.typography.size.lg,
    fontWeight: '600',
    marginTop: designSystem.spacing.md,
  },
  errorDetail: {
    color: designSystem.colors.text.secondary,
    fontSize: designSystem.typography.size.sm,
    marginTop: designSystem.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: designSystem.spacing.xxl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.primary[500],
    paddingHorizontal: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.layout.radius.lg,
    marginTop: designSystem.spacing.lg,
  },
  retryText: {
    color: 'white',
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    marginLeft: designSystem.spacing.sm,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topGradient: {
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centerPlayButton: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: designSystem.spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: designSystem.colors.primary[500],
    borderRadius: 2,
  },
  timeText: {
    color: 'white',
    fontSize: designSystem.typography.size.xs,
    minWidth: 80,
    textAlign: 'right',
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    padding: designSystem.spacing.sm,
    marginHorizontal: designSystem.spacing.xs,
  },
});
