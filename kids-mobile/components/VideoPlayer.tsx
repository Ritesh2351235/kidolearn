import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onClose?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VideoPlayer({ videoUrl, title, onClose }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000) as NodeJS.Timeout;
  }, []);

  const handlePlayPause = async () => {
    if (!videoRef.current || !status?.isLoaded) return;

    try {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      resetControlsTimeout();
    } catch (error) {
      console.error('Error playing/pausing video:', error);
    }
  };

  const handleRewind = async () => {
    if (!videoRef.current || !status?.isLoaded) return;

    try {
      const newPosition = Math.max(0, (status.positionMillis || 0) - 10000);
      await videoRef.current.setPositionAsync(newPosition);
      resetControlsTimeout();
    } catch (error) {
      console.error('Error rewinding video:', error);
    }
  };

  const handleFastForward = async () => {
    if (!videoRef.current || !status?.isLoaded) return;

    try {
      const newPosition = Math.min(
        status.durationMillis || 0,
        (status.positionMillis || 0) + 10000
      );
      await videoRef.current.setPositionAsync(newPosition);
      resetControlsTimeout();
    } catch (error) {
      console.error('Error fast forwarding video:', error);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const onPlaybackStatusUpdate = (newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setIsBuffering(newStatus.isBuffering || false);
    }
  };

  const progressPercentage = status?.isLoaded 
    ? ((status.positionMillis || 0) / (status.durationMillis || 1)) * 100 
    : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={resetControlsTimeout}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={true}
          isMuted={false}
          volume={1.0}
        />

        {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.bufferingText}>Loading video...</Text>
          </View>
        )}

        {showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={32} color="#fff" />
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
                <Ionicons name="play-back" size={40} color="#fff" />
                <Text style={styles.controlText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.controlButton, styles.playButton]} 
                onPress={handlePlayPause}
              >
                <Ionicons 
                  name={status?.isLoaded && status.isPlaying ? "pause" : "play"} 
                  size={60} 
                  color="#fff" 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.controlButton, styles.forwardButton]} 
                onPress={handleFastForward}
              >
                <Ionicons name="play-forward" size={40} color="#fff" />
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
                    {status?.isLoaded ? formatTime(status.positionMillis || 0) : '0:00'}
                  </Text>
                  <Text style={styles.timeText}>
                    {status?.isLoaded ? formatTime(status.durationMillis || 0) : '0:00'}
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
    color: '#ffffff',
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
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeText: {
    color: '#ffffff',
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
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});