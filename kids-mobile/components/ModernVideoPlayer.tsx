import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

interface ModernVideoPlayerProps {
  videoUrl: string;
  title: string;
  onClose?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ModernVideoPlayer({ videoUrl, title, onClose }: ModernVideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create video player with error handling
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
    player.play();
  });

  // Handle player status changes
  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      console.log('Video player status:', status);

      if (status.error) {
        console.error('Video player error:', status.error);
        setHasError(true);
        setErrorMessage(status.error.message || 'Failed to load video');
        setIsBuffering(false);
      } else {
        setHasError(false);
        setIsBuffering(status.status === 'loading');
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [player]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  const handlePlayPause = () => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
      resetControlsTimeout();
    } catch (error) {
      console.error('Error playing/pausing video:', error);
      showErrorAlert('Playback Error', 'Unable to control video playback.');
    }
  };

  const handleRewind = () => {
    try {
      const newPosition = Math.max(0, player.currentTime - 10);
      player.seekTo(newPosition);
      resetControlsTimeout();
    } catch (error) {
      console.error('Error rewinding video:', error);
    }
  };

  const handleFastForward = () => {
    try {
      const newPosition = Math.min(player.duration || 0, player.currentTime + 10);
      player.seekTo(newPosition);
      resetControlsTimeout();
    } catch (error) {
      console.error('Error fast forwarding video:', error);
    }
  };

  const handleClose = () => {
    try {
      player.pause();
    } catch (error) {
      console.error('Error pausing video on close:', error);
    }

    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Try Again', onPress: () => setHasError(false) },
        { text: 'Close', onPress: handleClose }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = player.duration > 0
    ? (player.currentTime / player.duration) * 100
    : 0;

  // Error state
  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.light.textOnColor} />
          </TouchableOpacity>

          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={64} color={Colors.light.error} />
            <Text style={styles.errorTitle}>Video Unavailable</Text>
            <Text style={styles.errorText}>
              {errorMessage || 'This video could not be played. Please check your internet connection and try again.'}
            </Text>

            <View style={styles.errorActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={() => {
                  setHasError(false);
                  setErrorMessage('');
                  player.play();
                }}
              >
                <Ionicons name="refresh" size={20} color={Colors.light.textOnColor} />
                <Text style={styles.actionButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.closeActionButton]}
                onPress={handleClose}
              >
                <Ionicons name="close" size={20} color={Colors.light.textOnColor} />
                <Text style={styles.actionButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={resetControlsTimeout}
      >
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
        />

        {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color={Colors.light.textOnColor} />
            <Text style={styles.bufferingText}>Loading video...</Text>
          </View>
        )}

        {showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={32} color={Colors.light.textOnColor} />
              </TouchableOpacity>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.rewindButton]}
                onPress={handleRewind}
              >
                <Ionicons name="play-back" size={40} color={Colors.light.textOnColor} />
                <Text style={styles.controlText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.playButton]}
                onPress={handlePlayPause}
              >
                <Ionicons
                  name={player.playing ? "pause" : "play"}
                  size={60}
                  color={Colors.light.textOnColor}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.forwardButton]}
                onPress={handleFastForward}
              >
                <Ionicons name="play-forward" size={40} color={Colors.light.textOnColor} />
                <Text style={styles.controlText}>10s</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>
                    {formatTime(player.currentTime)}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatTime(player.duration || 0)}
                  </Text>
                </View>
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
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  videoTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.light.textOnColor,
    letterSpacing: 0.5,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rewindButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  forwardButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  controlText: {
    color: Colors.light.textOnColor,
    fontSize: 10,
    fontWeight: '400',
    marginTop: -4,
    letterSpacing: 0.5,
  },
  bottomControls: {
    paddingBottom: 50,
    paddingHorizontal: 24,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeText: {
    color: Colors.light.textOnColor,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bufferingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bufferingText: {
    color: Colors.light.textOnColor,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: Colors.light.textOnColor,
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
  },
  closeActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: Colors.light.textOnColor,
    fontSize: 16,
    fontWeight: '600',
  },
});
