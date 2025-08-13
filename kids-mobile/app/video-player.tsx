import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import VideoPlayer from '@/components/VideoPlayer';
import YouTubePlayer from '@/components/YouTubePlayer';

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

  // For other video formats, use the regular video player
  if (finalVideoUrl) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <VideoPlayer
          videoUrl={finalVideoUrl}
          title={videoTitle}
          onClose={() => router.back()}
        />
      </View>
    );
  }

  // If no valid video URL, go back
  router.back();
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});