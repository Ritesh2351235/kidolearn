import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useActivityTracker } from '@/hooks/useActivityTracker';

interface YouTubePlayerProps {
  youtubeId: string;
  title: string;
  approvedVideoId?: string;
  childId?: string;
  channelName?: string;
  duration?: string;
  onClose?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function YouTubePlayer({ 
  youtubeId, 
  title, 
  approvedVideoId,
  childId,
  channelName = '',
  duration,
  onClose 
}: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  
  const activityTracker = useActivityTracker();
  const playStartTimeRef = useRef<number | null>(null);
  const videoStartedRef = useRef(false);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1&iv_load_policy=3&fs=1`;

  const handleClose = async () => {
    // Track video exit if user closes before completion
    if (childId && videoStartedRef.current) {
      try {
        await activityTracker.trackVideoExit(
          childId,
          youtubeId,
          title,
          channelName,
          0, // We don't have precise position from YouTube embed
          duration,
          approvedVideoId
        );
      } catch (error) {
        console.error('Error tracking video exit:', error);
      }
    }
    
    if (onClose) {
      onClose();
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = async () => {
    setIsLoading(false);
    
    // Track video play when the video loads and starts (since autoplay=1)
    if (childId && !videoStartedRef.current) {
      videoStartedRef.current = true;
      setHasStartedPlaying(true);
      playStartTimeRef.current = Date.now();
      
      try {
        await activityTracker.trackVideoPlay(
          childId,
          youtubeId,
          title,
          channelName,
          duration,
          approvedVideoId,
          0
        );
        
        console.log('Video play tracked for:', title);
      } catch (error) {
        console.error('Error tracking video play:', error);
      }
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Track video completion based on duration
  useEffect(() => {
    if (!hasStartedPlaying || !duration || !childId) return;

    // Parse duration (format: "MM:SS" or "HH:MM:SS")
    const parseDuration = (durationStr: string): number => {
      const parts = durationStr.split(':').map(Number);
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1]; // MM:SS
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
      }
      return 0;
    };

    const durationSeconds = parseDuration(duration);
    
    if (durationSeconds > 0) {
      // Set a timer to track completion after 90% of video duration
      const completionThreshold = durationSeconds * 0.9 * 1000; // Convert to milliseconds
      
      const timer = setTimeout(async () => {
        try {
          await activityTracker.trackVideoComplete(
            childId,
            youtubeId,
            title,
            channelName,
            duration,
            approvedVideoId,
            durationSeconds
          );
          
          console.log('Video completion tracked for:', title);
        } catch (error) {
          console.error('Error tracking video completion:', error);
        }
      }, completionThreshold);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [hasStartedPlaying, duration, childId, youtubeId, title, channelName, approvedVideoId, activityTracker]);

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
          
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={64} color="#ff4444" />
            <Text style={styles.errorTitle}>Unable to load video</Text>
            <Text style={styles.errorText}>
              This video could not be played. Please check your internet connection and try again.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleError}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});