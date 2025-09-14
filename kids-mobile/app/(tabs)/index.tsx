import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useChild } from '@/contexts/ChildContext';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { simpleApiClient, ApprovedVideo } from '@/lib/simpleApiClient';
import { networkManager } from '@/lib/networkManager';
import { Colors, Gradients } from '@/constants/Colors';
import { Fonts, FontSizes } from '@/constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { shadows } from '@/lib/shadowUtils';


export default function HomeScreen() {
  const { selectedChild } = useChild();
  const { getToken } = useAuth();
  const [videos, setVideos] = useState<ApprovedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const fetchingRef = useRef(false);
  const lastChildIdRef = useRef<string | null>(null);

  // Activity tracking
  const activityTracker = useActivityTracker();

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = networkManager.addNetworkListener((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setError('No internet connection');
      } else {
        setError(null);
      }
    });

    // Initial network check
    networkManager.checkConnection().then(setIsConnected);

    return unsubscribe;
  }, []);

    const fetchScheduledVideos = async (childId: string): Promise<ApprovedVideo[]> => {
    console.log('📅 Fetching scheduled videos for child:', childId);
    
    const token = await getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Use simple API client that handles all the complexity
    return await simpleApiClient.getScheduledVideos(childId, token);
  };

  const fetchVideos = useCallback(async (forceRefresh = false) => {
    try {
      const currentChild = selectedChild;
      if (!currentChild) {
        setVideos([]);
        setLoading(false);
        return;
      }

      // Prevent duplicate calls
      if (fetchingRef.current && !forceRefresh) {
        console.log('🚫 Fetch already in progress, skipping duplicate call');
        return;
      }

      // Skip if same child and not forced refresh
      if (lastChildIdRef.current === currentChild.id && !forceRefresh) {
        console.log('🚫 Same child already loaded, skipping duplicate fetch');
        return;
      }

      fetchingRef.current = true;
      lastChildIdRef.current = currentChild.id;
      setLoading(true);

      console.log('🔍 Fetching videos for child:', currentChild.name);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Only fetch scheduled videos for today
      const scheduledVideosData = await fetchScheduledVideos(currentChild.id);

      setVideos(scheduledVideosData);
      console.log('✅ Fetched', scheduledVideosData.length, 'scheduled videos for', currentChild.name);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
      Alert.alert(
        'Unable to Load Videos',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []); // Remove dependencies to prevent recreation loops

  // Single useEffect to handle child selection changes and start session
  useEffect(() => {
    console.log('🔄 Child selection changed:', selectedChild?.name || 'none');
    fetchVideos();

    // Start activity tracking session when child is selected
    if (selectedChild?.id && !activityTracker.isTrackingSession) {
      console.log('🎯 Starting activity tracking session for:', selectedChild.name);
      activityTracker.startSession(selectedChild.id);
    }
  }, [selectedChild?.id]); // Only depend on child ID to prevent function recreation loops

  // End session when component unmounts or child changes
  useEffect(() => {
    return () => {
      if (activityTracker.isTrackingSession) {
        activityTracker.endSession();
      }
    };
  }, [selectedChild?.id]);

  const switchProfile = () => {
    router.push('/main-dashboard');
  };

  const playVideo = async (video: ApprovedVideo) => {
    try {
      // Track video click activity
      if (selectedChild?.id) {
        console.log('📹 Tracking video click for:', video.title);
        try {
          await activityTracker.trackVideoClick(
            selectedChild.id,
            video.youtubeId,
            video.title,
            video.channelName,
            video.id
          );
        } catch (trackingError) {
          console.warn('Failed to track video click, continuing with playback:', trackingError);
        }

        // If this is a scheduled video, mark it as watched (requires internet)
        if (video.isScheduled && video.scheduledVideoId) {
          console.log('📅 Marking scheduled video as watched:', video.scheduledVideoId);
          try {
            await simpleApiClient.markScheduledVideoAsWatched(video.scheduledVideoId, selectedChild.id);
          } catch (error) {
            console.warn('Failed to mark scheduled video as watched:', error);
            // Don't block video playback if tracking fails
          }
        }
      }

      // Always try to play the video, even if API calls fail
      let videoParams = {
        youtubeId: video.youtubeId,
        title: video.title,
        approvedVideoId: video.id,
        childId: selectedChild?.id || '',
        channelName: video.channelName,
        duration: video.duration || '',
        isScheduled: video.isScheduled ? 'true' : 'false',
        scheduledVideoId: video.scheduledVideoId || '',
      };

      // Get video URL from API (with YouTube fallback)
      try {
        const token = await getToken();
        if (token) {
          const videoUrlData = await simpleApiClient.getVideoUrl(video.youtubeId, token);
          // Add video URL parameters (router accepts any string parameters)
          (videoParams as any).videoUrl = videoUrlData.embedUrl;
          (videoParams as any).iframeUrl = videoUrlData.iframeUrl;
          (videoParams as any).watchUrl = videoUrlData.watchUrl;
          console.log('✅ Video URL obtained from API');
        } else {
          // No token - use direct YouTube URLs
          (videoParams as any).videoUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1`;
          (videoParams as any).iframeUrl = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1&iv_load_policy=3&fs=1`;
          (videoParams as any).watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
          console.log('✅ Using direct YouTube URLs');
        }
      } catch (apiError) {
        console.log('⚠️ API failed, using direct YouTube URLs');
        // Fallback to direct YouTube URLs (still requires internet)
        (videoParams as any).videoUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1`;
        (videoParams as any).iframeUrl = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1&iv_load_policy=3&fs=1`;
        (videoParams as any).watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
      }

      router.push({
        pathname: '/video-player',
        params: videoParams,
      });

    } catch (error) {
      console.error('Critical error in video playback:', error);
      // Even in worst case, try basic YouTube playback
      router.push({
        pathname: '/video-player',
        params: {
          youtubeId: video.youtubeId,
          title: video.title,
          approvedVideoId: video.id,
          childId: selectedChild?.id || '',
          channelName: video.channelName,
          duration: video.duration || '',
          isScheduled: video.isScheduled ? 'true' : 'false',
          scheduledVideoId: video.scheduledVideoId || '',
        },
      });
    }
  };

  if (!selectedChild) {
    return null; // This should redirect in the layout
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Kids-Friendly Header with Gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.profileSection} onPress={switchProfile}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.profileAvatar}
            >
              <Text style={styles.avatarText}>
                {selectedChild.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.greeting}>Hello there! 👋</Text>
              <View style={styles.profileNameContainer}>
                <Text style={styles.profileName}>{selectedChild.name}</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.light.primary} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Hero Section */}
        <LinearGradient
          colors={['#F8FAFC', '#FFFFFF']}
          style={styles.welcomeSection}
        >
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Let's learn together with KidoLearn!</Text>
            <Text style={styles.welcomeSubtitle}>Registration successful!</Text>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
              <Text style={styles.successText}>Ready to learn!</Text>
            </View>
          </View>
          <View style={styles.heroIllustration}>
            <View style={styles.characterIcon}>
              <Text style={styles.characterEmoji}>🎉</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <Ionicons name="play-circle-outline" size={48} color="#A78BFA" />
            </View>
            <Text style={styles.loadingText}>Loading your videos...</Text>
          </View>
        ) : videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={64} color="#A78BFA" />
            </View>
            <Text style={styles.emptyTitle}>No videos scheduled for today!</Text>
            <Text style={styles.emptySubtext}>
              Your parent hasn't scheduled any videos for today. Check back tomorrow or ask them to schedule some videos for you!
            </Text>
          </View>
        ) : (
          <>


            {/* Video Grid */}
            <View style={styles.videosSection}>
              <Text style={styles.sectionTitle}>Today's Scheduled Videos</Text>
              <View style={styles.videoGrid}>
                {videos.map((video, index) => {
                  // Cycle through different gradient colors for cards
                  const gradients = [['#8B5CF6', '#EC4899'], ['#A855F7', '#EC4899'], ['#8B5CF6', '#3B82F6'], ['#F59E0B', '#EF4444']];
                  const cardGradient = gradients[index % gradients.length];

                  return (
                    <TouchableOpacity
                      key={video.id}
                      style={styles.videoCard}
                      onPress={() => playVideo(video)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={cardGradient}
                        style={styles.videoCardGradient}
                      >
                        <View style={styles.thumbnailContainer}>
                          <Image
                            source={{ uri: video.thumbnail }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                          />
                          <View style={styles.playButtonOverlay}>
                            <LinearGradient
                              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                              style={styles.playButton}
                            >
                              <Ionicons name="play" size={20} color={Colors.light.primary} />
                            </LinearGradient>
                          </View>
                          {video.isScheduled && video.carriedOver && (
                            <View style={styles.carriedOverBadge}>
                              <Text style={styles.carriedOverText}>↪ Carried Over</Text>
                            </View>
                          )}
                          {video.isScheduled && !video.carriedOver && (
                            <View style={styles.scheduledBadge}>
                              <Text style={styles.scheduledText}>📅 Today</Text>
                            </View>
                          )}
                          {!video.watched && !video.isScheduled && (
                            <View style={styles.newBadge}>
                              <Text style={styles.newText}>NEW!</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.videoInfo}>
                          <Text style={styles.videoTitle} numberOfLines={2}>
                            {video.title}
                          </Text>
                          <Text style={styles.channelName}>{video.channelName}</Text>
                          <View style={styles.videoStats}>
                            <View style={styles.watchedIndicator}>
                              <Ionicons
                                name={video.watched ? "checkmark-circle" : "time-outline"}
                                size={14}
                                color="rgba(255,255,255,0.8)"
                              />
                              <Text style={styles.statusText}>
                                {video.duration}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    color: Colors.light.textOnColor,
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    color: Colors.light.textSecondary,
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    marginBottom: 2,
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    color: Colors.light.textPrimary,
    fontSize: FontSizes.xl,
    fontFamily: Fonts.ui.bold,
    marginRight: 6,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.content.extrabold,
    color: Colors.light.textPrimary,
    marginBottom: 8,
    lineHeight: 32,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.lg,
    color: Colors.light.textSecondary,
    fontFamily: Fonts.content.semibold,
    marginBottom: 12,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  successText: {
    color: Colors.light.success,
    fontSize: FontSizes.base,
    fontFamily: Fonts.ui.semibold,
    marginLeft: 6,
  },
  heroIllustration: {
    alignItems: 'center',
  },
  characterIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 28,
  },
  categoriesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.button,
  },
  categoryGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryIconImage: {
    width: 32,
    height: 32,
  },
  categoryTitle: {
    color: Colors.light.textOnColor,
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.bold,
    textAlign: 'center',
    lineHeight: 18,
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.button,
  },
  featureGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  featureTitle: {
    color: Colors.light.textOnColor,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.bold,
    marginTop: 8,
    textAlign: 'center',
  },
  videosSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    color: Colors.light.textPrimary,
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.ui.bold,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.light.textSecondary,
    fontSize: FontSizes.lg,
    textAlign: 'center',
    fontFamily: Fonts.content.regular,
    lineHeight: 24,
  },
  videoGrid: {
    gap: 16,
  },
  videoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.large,
    marginBottom: 8,
  },
  videoCardGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    margin: 12,
    marginBottom: 0,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.primary,
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newText: {
    color: Colors.light.textOnColor,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.ui.bold,
    letterSpacing: 0.5,
  },
  scheduledBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduledText: {
    color: Colors.light.textOnColor,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.ui.bold,
    letterSpacing: 0.5,
  },
  carriedOverBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.warning, // Use purple warning color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carriedOverText: {
    color: Colors.light.textOnColor,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.ui.bold,
    letterSpacing: 0.5,
  },
  videoInfo: {
    padding: 16,
    paddingTop: 12,
  },
  videoTitle: {
    color: Colors.light.textOnColor,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    marginBottom: 6,
    lineHeight: 22,
  },
  channelName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    marginBottom: 8,
  },
  videoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watchedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    marginLeft: 4,
    color: 'rgba(255,255,255,0.8)',
  },
  bottomSpacing: {
    height: 100,
  },
});
