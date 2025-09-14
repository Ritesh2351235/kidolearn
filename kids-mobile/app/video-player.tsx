import React from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ModernVideoPlayer from '@/components/ModernVideoPlayer';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function VideoPlayerScreen() {
  const params = useLocalSearchParams();
  const {
    videoUrl,
    title,
    youtubeId,
    iframeUrl,
    watchUrl,
    approvedVideoId,
    childId,
    channelName,
    duration
  } = params;

  const isYouTubeVideo = () => {
    if (youtubeId && typeof youtubeId === 'string') {
      return true;
    }

    if (videoUrl && typeof videoUrl === 'string') {
      return videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('youtube-nocookie.com');
    }

    return false;
  };

  const getVideoUrl = () => {
    // For non-YouTube videos, use the provided URL
    if (videoUrl && typeof videoUrl === 'string' && !isYouTubeVideo()) {
      return videoUrl;
    }

    return null;
  };

  const videoTitle = typeof title === 'string' ? title : 'Video';
  const finalVideoUrl = getVideoUrl();

  // If we have a YouTube ID or YouTube URL, use the YouTube player
  if (isYouTubeVideo() && youtubeId && typeof youtubeId === 'string') {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <YouTubePlayer
          youtubeId={youtubeId}
          title={videoTitle}
          approvedVideoId={typeof approvedVideoId === 'string' ? approvedVideoId : undefined}
          childId={typeof childId === 'string' ? childId : undefined}
          channelName={typeof channelName === 'string' ? channelName : ''}
          duration={typeof duration === 'string' ? duration : undefined}
          onClose={() => router.back()}
        />
      </View>
    );
  }

  // For other video formats, use the modern video player
  if (finalVideoUrl) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <ModernVideoPlayer
          videoUrl={finalVideoUrl}
          title={videoTitle}
          onClose={() => router.back()}
        />
      </View>
    );
  }

  // If no valid video URL, show error screen
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.errorContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.light.textOnColor} />
        </TouchableOpacity>

        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={64} color={Colors.light.error} />
          <Text style={styles.errorTitle}>No Video Available</Text>
          <Text style={styles.errorText}>
            This video cannot be played right now. This might be due to:
          </Text>
          <Text style={styles.errorList}>
            • Network connectivity issues{'\n'}
            • Video server is temporarily unavailable{'\n'}
            • Invalid video format or URL
          </Text>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.light.textOnColor} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
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
    alignSelf: 'flex-start',
    marginBottom: 20,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  errorList: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  backButtonText: {
    color: Colors.light.textOnColor,
    fontSize: 16,
    fontWeight: '600',
  },
});