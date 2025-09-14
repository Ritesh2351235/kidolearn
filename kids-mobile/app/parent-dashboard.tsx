import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  Dimensions,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ParentScheduleModal from '@/components/ParentScheduleModal';
import ParentAnalyticsModal from '@/components/ParentAnalyticsModal';
import { apiClient } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/productionConfig';
import { Colors, Gradients, ThemeColors } from '@/constants/Colors';
import { Fonts, FontSizes } from '@/constants/Fonts';
import { getAgeGroupInfo, getCategoryIcon } from '@/lib/growth-categories';
import FilterModal from '@/components/FilterModal';

const { width } = Dimensions.get('window');

interface Child {
  id: string;
  name: string;
  birthday: string;
  interests: string[];
}

interface ParentStats {
  totalChildren: number;
  totalApprovedVideos: number;
  totalWatchedVideos: number;
  watchRate: number;
  totalWatchTime: number;
  favoriteCategories: Array<{ category: string; count: number }>;
  weeklyProgress: Array<{ day: string; videos: number }>;
  childrenStats: Array<{
    childId: string;
    childName: string;
    watchedVideos: number;
    totalTime: number;
    favoriteCategory: string;
  }>;
}

interface ApprovedVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  summary: string;
  watched: boolean;
  createdAt: string;
  child: {
    id: string;
    name: string;
  };
}

interface VideoRecommendation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
  category: string;
  summary: string;
}

interface ScheduledVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  scheduledDate: string;
  childId: string;
  childName: string;
  isWatched: boolean;
  carriedOver: boolean;
  channelName: string;
  youtubeId: string;
  description: string;
  summary: string;
}

enum TabType {
  OVERVIEW = 'overview',
  RECOMMENDATIONS = 'recommendations',
  APPROVED = 'approved',
  SCHEDULE = 'schedule',
  ANALYTICS = 'analytics'
}

export default function ParentDashboard() {
  const { getToken } = useAuth();


  const [activeTab, setActiveTab] = useState<TabType>(TabType.OVERVIEW);
  const [children, setChildren] = useState<Child[]>([]);
  const [stats, setStats] = useState<ParentStats>({
    totalChildren: 0,
    totalApprovedVideos: 0,
    totalWatchedVideos: 0,
    watchRate: 0,
    totalWatchTime: 0,
    favoriteCategories: [],
    weeklyProgress: [],
    childrenStats: []
  });
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('any');
  const [selectedUploadDate, setSelectedUploadDate] = useState('any');
  const [selectedSortBy, setSelectedSortBy] = useState('relevance');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [lastFetchedKey, setLastFetchedKey] = useState<string>('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  // CACHE REMOVED: For better user experience with fresh content on every refresh
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [approvingVideos, setApprovingVideos] = useState<Set<string>>(new Set());

  // Helper to get current filters object
  const getCurrentFilters = () => ({
    category: selectedCategory,
    duration: selectedDuration,
    uploadDate: selectedUploadDate,
    sortBy: selectedSortBy,
  });

  // Helper to set all filters at once
  const setAllFilters = (filters: any) => {
    setSelectedCategory(filters.category);
    setSelectedDuration(filters.duration);
    setSelectedUploadDate(filters.uploadDate);
    setSelectedSortBy(filters.sortBy);
  };

  // Search history management
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
        console.log('📚 Loaded search history:', JSON.parse(history).length, 'items');
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchQuery = async (query: string) => {
    if (!query.trim()) return;

    try {
      const trimmedQuery = query.trim();
      let newHistory = [trimmedQuery, ...searchHistory.filter(h => h !== trimmedQuery)];
      // Keep only last 10 searches
      newHistory = newHistory.slice(0, 10);

      setSearchHistory(newHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
      console.log('💾 Saved search query:', trimmedQuery);
    } catch (error) {
      console.error('Error saving search query:', error);
    }
  };
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [videoDetailModalVisible, setVideoDetailModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecommendation | null>(null);
  const [videoSummary, setVideoSummary] = useState<string>('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    loadParentData();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === TabType.RECOMMENDATIONS && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [activeTab, children]);

  useEffect(() => {
    if (activeTab === TabType.RECOMMENDATIONS && selectedChildId) {
      resetPaginationAndLoadRecommendations();
    }
  }, [selectedChildId, activeTab]);

  const loadParentData = async () => {
    try {
      console.log('📈 Loading parent dashboard data...');

      // Load children data
      let childrenData = [];
      try {
        const token = await getToken();
        if (token) {
          childrenData = await apiClient.getChildren(token);
          setChildren(childrenData);
          console.log('✅ Loaded children from API:', childrenData.length);
        } else {
          console.error('No authentication token available');
          router.replace('/auth');
          return;
        }
      } catch (apiError) {
        console.error('Error loading children data:', apiError);
        Alert.alert(
          'Authentication Error',
          'Unable to load your data. Please sign in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                signOut();
                router.replace('/auth');
              }
            }
          ]
        );
        return;
      }

      // Load analytics data
      await loadAnalytics();

      // Load approved videos
      await loadApprovedVideos();

      // Load scheduled videos
      await loadScheduledVideos();

      console.log('✅ Loaded parent dashboard data successfully');
    } catch (error) {
      console.error('Error loading parent data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await fetch(`${getApiBaseUrl()}/api/parent/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          let analyticsData: any = {};
          try {
            analyticsData = await response.json();
          } catch (parseError) {
            console.log('⚠️ Could not parse analytics response as JSON:', parseError);
            throw new Error('Invalid analytics response format');
          }
          
          // Transform new API format to match existing UI expectations
          const transformedStats = {
            totalChildren: analyticsData.children?.length || children.length,
            totalApprovedVideos: analyticsData.overview?.uniqueVideosWatched || 0,
            totalWatchedVideos: analyticsData.overview?.uniqueVideosWatched || 0,
            watchRate: Math.round((analyticsData.overview?.averageCompletionRate || 0) * 100),
            totalWatchTime: Math.round((analyticsData.overview?.totalWatchTimeSeconds || 0) / 60),
            favoriteCategories: analyticsData.topChannels?.slice(0, 5).map(channel => ({
              category: channel.name,
              count: channel.watchCount
            })) || [],
            weeklyProgress: analyticsData.dailyActivity?.map((day, index) => ({
              day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][new Date(day.date).getDay()],
              videos: day.activities_count
            })) || [],
            childrenStats: analyticsData.children?.map(child => ({
              childId: child.id,
              childName: child.name,
              watchedVideos: 0, // Will be calculated from activities
              totalTime: 0, // Will be calculated from activities
              favoriteCategory: 'General'
            })) || []
          };
          
          setStats(transformedStats);
          console.log('✅ Loaded analytics from API', transformedStats);
        } else {
          throw new Error('Analytics API failed');
        }
      }
    } catch (analyticsError) {
      console.log('⚠️ Analytics API error:', analyticsError);
      // Set empty but valid stats instead of mock data
      setStats({
        totalChildren: children.length,
        totalApprovedVideos: 0,
        totalWatchedVideos: 0,
        watchRate: 0,
        totalWatchTime: 0,
        favoriteCategories: [],
        weeklyProgress: Array(7).fill(0).map((_, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          videos: 0
        })),
        childrenStats: children.map(child => ({
          childId: child.id,
          childName: child.name,
          watchedVideos: 0,
          totalTime: 0,
          favoriteCategory: 'General'
        }))
      });
    }
  };

  const loadApprovedVideos = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('❌ No auth token for approved videos');
        setApprovedVideos([]);
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/approved-videos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        try {
          const data = await response.json();
          setApprovedVideos(data.approvedVideos || []);
          console.log('✅ Loaded', data.approvedVideos?.length || 0, 'approved videos');
        } catch (parseError) {
          console.log('⚠️ Could not parse approved videos response as JSON');
          setApprovedVideos([]);
        }
      } else {
        console.log('❌ Approved videos API error:', response.status);
        try {
          const errorData = await response.json();
          console.log('❌ Error details:', errorData);
        } catch (parseError) {
          console.log('⚠️ Could not parse approved videos error response');
        }
        setApprovedVideos([]);
      }
    } catch (error) {
      console.log('❌ Approved videos API error:', error);
      setApprovedVideos([]);
    }
  };

  const loadRecommendations = async (loadMore = false) => {
    if (!selectedChildId) return;

    try {
      const token = await getToken();
      if (!token) {
        console.log('❌ No auth token for recommendations');
        return;
      }
      const selectedChild = children.find(c => c.id === selectedChildId);
      if (!selectedChild) return;

      // Always fetch fresh videos for better user experience
      console.log('🔄 Fetching fresh videos for:', selectedChild.name);

      const params = new URLSearchParams({
        childId: selectedChildId,
        maxResults: '10',
      });

      // Add page token for pagination
      if (loadMore && nextPageToken) {
        params.append('pageToken', nextPageToken);
      } else if (loadMore && !nextPageToken) {
        // Fallback: simulate pagination by requesting more results and skipping existing ones
        params.set('maxResults', String(10 + recommendations.length));
        console.log('📄 Using offset-based pagination, requesting:', 10 + recommendations.length);
      }

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (selectedDuration && selectedDuration !== 'any') {
        params.append('duration', selectedDuration);
      }

      if (selectedUploadDate && selectedUploadDate !== 'any') {
        params.append('uploadDate', selectedUploadDate);
      }

      if (selectedSortBy) {
        params.append('sortBy', selectedSortBy);
      }

      const requestKey = `recommendations-${selectedChildId}-${searchQuery}-${selectedCategory}-${selectedDuration}-${selectedUploadDate}-${selectedSortBy}-${loadMore ? nextPageToken : 'initial'}`;

      console.log('🔍 Request details:', {
        childId: selectedChildId,
        searchQuery,
        selectedCategory,
        selectedDuration,
        selectedUploadDate,
        selectedSortBy,
        loadMore,
        nextPageToken,
        requestKey
      });

      // Prevent duplicate requests
      if (requestKey === lastFetchedKey && !loadMore) {
        console.log('🚫 Preventing duplicate recommendation request');
        return;
      }

      setLastFetchedKey(requestKey);
      setRateLimitError(null); // Clear any previous rate limit errors

      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoadingRecommendations(true);
      }

      const apiBaseUrl = getApiBaseUrl();
      const fullUrl = `${apiBaseUrl}/api/recommendations?${params.toString()}`;
      console.log('🌐 Making API request to:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const errorData = await response.json();
        setRateLimitError(errorData.message || `Too many requests. Please wait ${retryAfter} seconds`);

        // Auto-clear error after retry period
        if (retryAfter) {
          setTimeout(() => {
            setRateLimitError(null);
          }, (parseInt(retryAfter) + 1) * 1000);
        }
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const newRecommendations = data.recommendations || [];

        // Log API response details for debugging
        console.log('📊 API Response:', {
          recommendationsCount: newRecommendations.length,
          hasNextPageToken: !!data.nextPageToken,
          totalResults: data.totalResults,
          message: data.message
        });

        // If API returned a message (usually indicates no videos found), log it
        if (data.message) {
          console.log('📝 API Message:', data.message);
        }

        let finalRecommendations: VideoRecommendation[];
        if (loadMore) {
          if (nextPageToken) {
            // Normal pagination with pageToken
            finalRecommendations = [...recommendations, ...newRecommendations];
          } else {
            // Fallback pagination: filter out duplicates and take new ones
            const existingIds = new Set(recommendations.map(v => v.id));
            const newUniqueVideos = newRecommendations.filter(v => !existingIds.has(v.id));
            finalRecommendations = [...recommendations, ...newUniqueVideos.slice(0, 10)];
            console.log('📄 Filtered duplicates, adding:', newUniqueVideos.length, 'new videos');
          }
          setRecommendations(finalRecommendations);
        } else {
          finalRecommendations = newRecommendations;
          setRecommendations(finalRecommendations);
        }

        const newNextPageToken = data.nextPageToken || null;
        // Show Load More if we have nextPageToken OR if we got the max requested results (likely more available)
        const newHasMore = (!!data.nextPageToken && newRecommendations.length > 0) ||
          (newRecommendations.length >= 10 && data.totalResults > finalRecommendations.length);

        setNextPageToken(newNextPageToken);
        setHasMoreVideos(newHasMore);

        // CACHING DISABLED: Always get fresh content for better user experience
        console.log('✅ Fresh recommendations loaded:', finalRecommendations.length, 'videos');
      } else {
        console.error('❌ Recommendations API error:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error details:', errorData);
        if (!loadMore) {
          setRecommendations([]);
        }
      }
    } catch (error) {
      console.error('❌ Recommendations API failed:', error);
      if (!loadMore) {
        setRecommendations([]);
      }
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoadingRecommendations(false);
      }
    }
  };

  const loadMoreRecommendations = async () => {
    if (!hasMoreVideos || loadingMore) {
      return;
    }

    // Allow loading more even without nextPageToken for category searches
    console.log('🔄 Loading more recommendations...', { hasMoreVideos, loadingMore, nextPageToken });
    await loadRecommendations(true);
  };

  const resetPaginationAndLoadRecommendations = async (forceRefresh = false) => {
    setRecommendations([]);
    setNextPageToken(null);
    setHasMoreVideos(true);
    setLastFetchedKey(''); // Clear the duplicate request key to allow fresh fetch

    console.log('🔄 Resetting pagination and loading fresh recommendations');

    await loadRecommendations(false);
  };

  const loadScheduledVideos = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('❌ No auth token for scheduled videos');
        setScheduledVideos([]);
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/scheduled-videos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        try {
          const data = await response.json();
          setScheduledVideos(data.scheduledVideos || []);
          console.log('✅ Loaded', data.scheduledVideos?.length || 0, 'scheduled videos');
        } catch (parseError) {
          console.log('⚠️ Could not parse scheduled videos response as JSON');
          setScheduledVideos([]);
        }
      } else {
        console.log('❌ Scheduled videos API error:', response.status);
        try {
          const errorData = await response.json();
          console.log('❌ Error details:', errorData);
        } catch (parseError) {
          console.log('⚠️ Could not parse scheduled videos error response');
        }
        setScheduledVideos([]);
      }
    } catch (error) {
      console.log('❌ Scheduled videos API error:', error);
      setScheduledVideos([]);
    }
  };

  const calculateAge = (birthday: string) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const loadVideoSummary = async (video: VideoRecommendation) => {
    if (!selectedChildId) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/videos/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoTitle: video.title,
          videoDescription: video.description,
          childId: selectedChildId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideoSummary(data.summary || 'Summary not available');
      } else {
        setVideoSummary('Summary not available');
      }
    } catch (error) {
      console.log('Summary API not available');
      setVideoSummary('Summary not available');
    }
  };

  const showVideoDetail = (video: VideoRecommendation) => {
    setSelectedVideo(video);
    setVideoDetailModalVisible(true);
    loadVideoSummary(video);
  };

  const approveVideo = async (video: VideoRecommendation) => {
    if (!selectedChildId) return;

    // Add to approving state
    setApprovingVideos(prev => new Set(prev).add(video.id));

    try {
      console.log('📝 Approving video:', video.title);

      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/approved-videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedChildId,
          youtubeId: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          duration: video.duration,
          summary: video.summary,
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.log('⚠️ Could not parse rate limit response as JSON');
          errorData = { message: `Too many approvals. Please wait ${retryAfter || '60'} seconds` };
        }
        Alert.alert('Rate Limit Exceeded', errorData.message || `Too many approvals. Please wait ${retryAfter} seconds`);
        return;
      }

      if (response.ok) {
        console.log('✅ Video approved successfully!', video.title);

        // Remove approved video from recommendations
        setRecommendations(prev => prev.filter(v => v.id !== video.id));

        // Close modal if this video was being viewed
        if (selectedVideo?.id === video.id) {
          setVideoDetailModalVisible(false);
        }

        // Refresh approved videos list
        await loadApprovedVideos();

        console.log('✅ Video approved and removed from recommendations');
      } else {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON:', parseError);
          const textResponse = await response.text().catch(() => 'Unknown error');
          console.error('❌ Approve video error (text):', textResponse);
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        console.error('❌ Approve video error:', errorData);
        Alert.alert('Error', errorData.error || 'Failed to approve video');
      }
    } catch (error) {
      console.error('❌ Approve video network error:', error);
      Alert.alert('Error', 'Failed to approve video. Please check your connection.');
    } finally {
      // Remove from approving state
      setApprovingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.id);
        return newSet;
      });
    }
  };

  const removeApprovedVideo = async (videoId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/approved-videos?videoId=${encodeURIComponent(videoId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Video removed successfully! 🗑️');
        await loadApprovedVideos();
      } else {
        const errorData = await response.json();
        console.error('❌ Remove video error:', errorData);
        Alert.alert('Error', errorData.error || 'Failed to remove video');
      }
    } catch (error) {
      console.error('❌ Remove video network error:', error);
      Alert.alert('Error', 'Failed to remove video. Please check your connection.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    console.log('🔄 Refreshing tab:', activeTab);

    // Tab-specific refresh logic
    if (activeTab === TabType.RECOMMENDATIONS) {
      // For browse section, refresh videos only
      console.log('🎬 Refreshing recommendations/browse section');
      setRecommendations([]);
      setNextPageToken(null);
      setHasMoreVideos(true);
      setApprovingVideos(new Set());
      setLastFetchedKey(''); // Clear duplicate prevention key

      if (selectedChildId) {
        setLoadingRecommendations(true); // Show loading state
        await resetPaginationAndLoadRecommendations(true);
      }
      setRefreshing(false);
    } else {
      // For other tabs, do full refresh
      await loadParentData();
    }
  };

  // Separate function for recommendations refresh to avoid confusion
  const refreshRecommendations = async () => {
    console.log('🔄 Manually refreshing recommendations');
    setRecommendations([]);
    setNextPageToken(null);
    setHasMoreVideos(true);
    setLoadingRecommendations(true);
    setLastFetchedKey(''); // Clear duplicate prevention key to allow fresh fetch

    if (selectedChildId) {
      await loadRecommendations(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TabType.OVERVIEW:
        return renderOverview();
      case TabType.RECOMMENDATIONS:
        return renderRecommendations();
      case TabType.APPROVED:
        return renderApprovedVideos();
      case TabType.SCHEDULE:
        return renderSchedule();
      case TabType.ANALYTICS:
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.scrollContent}
    >

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="person.2.fill"
            title="Children"
            value={stats.totalChildren}
            color={ThemeColors.analytics.children}
          />
          <StatCard
            icon="hand.thumbsup.fill"
            title="Approved"
            value={stats.totalApprovedVideos}
            color={ThemeColors.analytics.activity}
          />
          <StatCard
            icon="play.circle.fill"
            title="Watched"
            value={stats.totalWatchedVideos}
            color={ThemeColors.analytics.progress}
          />
          <StatCard
            icon="chart.line.uptrend.xyaxis"
            title="Rate"
            value={`${stats.watchRate}%`}
            color={ThemeColors.analytics.completion}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveTab(TabType.RECOMMENDATIONS)}
        >
          <LinearGradient colors={Gradients.primaryPurple} style={styles.actionGradient}>
            <View style={styles.actionIcon}>
              <IconSymbol name="magnifyingglass" size={24} color={Colors.light.textOnColor} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Browse Recommendations</Text>
              <Text style={styles.actionDescription}>Find new videos for your children</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveTab(TabType.SCHEDULE)}
        >
          <LinearGradient colors={Gradients.lightPurple} style={styles.actionGradient}>
            <View style={styles.actionIcon}>
              <IconSymbol name="calendar.badge.plus" size={24} color={Colors.light.textOnColor} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Schedule Videos</Text>
              <Text style={styles.actionDescription}>Plan content for specific dates</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveTab(TabType.ANALYTICS)}
        >
          <LinearGradient colors={Gradients.purpleBlue} style={styles.actionGradient}>
            <View style={styles.actionIcon}>
              <IconSymbol name="chart.bar.fill" size={24} color={Colors.light.textOnColor} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Analytics</Text>
              <Text style={styles.actionDescription}>Track viewing patterns and progress</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Children Overview */}
      <View style={styles.childrenSection}>
        <Text style={styles.sectionTitle}>Your Children</Text>

        {children.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No children added yet</Text>
            <Text style={styles.emptySubtext}>
              Start by adding your first child profile to get personalized video recommendations.
            </Text>
          </View>
        ) : (
          children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderRecommendations = () => {
    const selectedChild = children.find(c => c.id === selectedChildId);
    const ageGroupInfo = selectedChild ? getAgeGroupInfo(selectedChild.birthday) : null;

    return (
      <View style={styles.browseContainer}>
        {/* Header Section */}
        <View style={styles.browseHeader}>
          {/* Child Selector */}
          <View style={styles.compactChildSelector}>
            <Text style={styles.compactSelectorLabel}>For:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScrollView}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.compactChildChip,
                    selectedChildId === child.id && styles.compactChildChipActive
                  ]}
                  onPress={() => setSelectedChildId(child.id)}
                >
                  <Text style={[
                    styles.compactChildChipText,
                    selectedChildId === child.id && styles.compactChildChipTextActive
                  ]}>
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Compact Age Info */}
          {ageGroupInfo && (
            <View style={styles.compactAgeInfo}>
              <Text style={styles.compactAgeText}>
                {ageGroupInfo.ageGroup} • {ageGroupInfo.age} years • Focus: {ageGroupInfo.skillFocus.slice(0, 2).join(', ')}
              </Text>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.browseSearchSection}>
            <View style={styles.browseSearchContainer}>
              <IconSymbol name="magnifyingglass" size={18} color={Colors.light.textSecondary} />
              <TextInput
                style={styles.browseSearchInput}
                placeholder="Search videos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 150)}
                onSubmitEditing={() => {
                  saveSearchQuery(searchQuery);
                  loadRecommendations();
                }}
              />
              {searchHistory.length > 0 && (
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => setShowSearchSuggestions(!showSearchSuggestions)}
                >
                  <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <IconSymbol name="slider.horizontal.3" size={18} color={Colors.light.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.refreshVideosButton}
                onPress={refreshRecommendations}
              >
                <Ionicons name="refresh" size={18} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>

            {/* Search Suggestions */}
            {showSearchSuggestions && searchHistory.length > 0 && (
              <View style={styles.searchSuggestions}>
                <Text style={styles.suggestionHeader}>Recent searches</Text>
                {searchHistory.slice(0, 5).map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(item);
                      setShowSearchSuggestions(false);
                      saveSearchQuery(item);
                      loadRecommendations();
                    }}
                  >
                    <Ionicons name="search" size={14} color={Colors.light.textTertiary} />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
                {searchHistory.length > 5 && (
                  <TouchableOpacity
                    style={styles.clearHistoryButton}
                    onPress={async () => {
                      setSearchHistory([]);
                      await AsyncStorage.removeItem('searchHistory');
                      console.log('🗑️ Cleared search history');
                      setShowSearchSuggestions(false);
                    }}
                  >
                    <Text style={styles.clearHistoryText}>Clear history</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Active Filters Summary */}
          {(selectedCategory !== 'all' || selectedDuration !== 'any' || selectedUploadDate !== 'any' || selectedSortBy !== 'relevance') && (
            <View style={styles.activeFiltersContainer}>
              <Text style={styles.activeFiltersLabel}>Active filters:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
                {selectedCategory !== 'all' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {ageGroupInfo?.categories.find(cat => cat.id === selectedCategory)?.name || selectedCategory}
                    </Text>
                  </View>
                )}
                {selectedDuration !== 'any' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>{selectedDuration}</Text>
                  </View>
                )}
                {selectedUploadDate !== 'any' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>{selectedUploadDate}</Text>
                  </View>
                )}
                {selectedSortBy !== 'relevance' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>{selectedSortBy}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Rate Limit Warning Banner */}
        {rateLimitError && (
          <View style={styles.rateLimitBanner}>
            <IconSymbol name="exclamationmark.triangle" size={20} color={Colors.light.error} />
            <Text style={styles.rateLimitText}>{rateLimitError}</Text>
          </View>
        )}

        {/* Video Grid - Full Screen Scrollable */}
        <FlatList
          data={recommendations}
          renderItem={({ item }) => (
            <VideoRecommendationCard
              video={item}
              onApprove={() => approveVideo(item)}
              onPress={() => showVideoDetail(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.videoGridContent}
          columnWrapperStyle={styles.videoGridRow}
          ListEmptyComponent={
            loadingRecommendations ? (
              <View style={styles.loadingRecommendationsContainer}>
                <LinearGradient
                  colors={['#F3E8FF', '#E0E7FF']}
                  style={styles.progressiveLoaderCard}
                >
                  <View style={styles.progressiveLoaderContent}>
                    <View style={styles.progressiveLoaderIcon}>
                      <Ionicons name="sparkles" size={32} color={Colors.light.primary} />
                    </View>
                    <Text style={styles.progressiveLoaderTitle}>Finding Perfect Videos</Text>
                    <Text style={styles.progressiveLoaderSubtitle}>
                      Searching through thousands of educational videos for {children.find(c => c.id === selectedChildId)?.name}...
                    </Text>
                    <View style={styles.progressiveLoaderSteps}>
                      <View style={styles.progressStep}>
                        <View style={[styles.stepIndicator, styles.stepIndicatorActive]} />
                        <Text style={[styles.stepText, styles.stepTextActive]}>Analyzing interests</Text>
                      </View>
                      <View style={styles.progressStep}>
                        <View style={[styles.stepIndicator, styles.stepIndicatorActive]} />
                        <Text style={[styles.stepText, styles.stepTextActive]}>Filtering content</Text>
                      </View>
                      <View style={styles.progressStep}>
                        <View style={styles.stepIndicator} />
                        <Text style={styles.stepText}>Curating videos</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <IconSymbol name="tv" size={48} color={Colors.light.textTertiary} />
                <Text style={styles.emptyTitle}>No videos found</Text>
                <Text style={styles.emptySubtext}>
                  {rateLimitError
                    ? 'Rate limit exceeded. Please wait before making more requests.'
                    : selectedChildId
                      ? 'Try adjusting your search or filters'
                      : 'Select a child to see recommendations'}
                </Text>
                {selectedChildId && !rateLimitError && (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setFilterModalVisible(true)}
                  >
                    <Text style={styles.emptyButtonText}>Adjust Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
          ListFooterComponent={() => (
            hasMoreVideos && !loadingMore && recommendations.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreRecommendations}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={Gradients.primaryPurple}
                    style={styles.loadMoreGradient}
                  >
                    <Ionicons name="add" size={20} color={Colors.light.textOnColor} />
                    <Text style={styles.loadMoreText}>Load More Videos</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <View style={styles.loadingMoreIndicator}>
                  <Ionicons name="reload" size={24} color={Colors.light.primary} />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              </View>
            ) : null
          )}
        />
      </View>
    );
  };

  const renderApprovedVideos = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={approvedVideos}
        renderItem={({ item }) => (
          <ApprovedVideoCard
            video={item}
            onRemove={() => removeApprovedVideo(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.videoList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="hand.thumbsup" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No approved videos yet</Text>
            <Text style={styles.emptySubtext}>
              Browse recommendations and approve videos for your children.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setActiveTab(TabType.RECOMMENDATIONS)}
            >
              <Text style={styles.emptyButtonText}>Browse Recommendations</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );

  const renderSchedule = () => {
    // Group videos by date
    const groupedVideos = scheduledVideos.reduce((acc, video) => {
      const date = new Date(video.scheduledDate).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(video);
      return acc;
    }, {} as Record<string, ScheduledVideo[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedVideos).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    const formatDateHeader = (dateString: string) => {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = dayNames[date.getDay()];
      const monthName = monthNames[date.getMonth()];
      const dayNumber = date.getDate();

      if (date.toDateString() === today.toDateString()) {
        return `Today, ${dayName} • ${monthName} ${dayNumber}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow, ${dayName} • ${monthName} ${dayNumber}`;
      } else {
        return `${dayName} • ${monthName} ${dayNumber}`;
      }
    };

    return (
      <View style={styles.tabContent}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>Scheduled Videos</Text>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => setScheduleModalVisible(true)}
          >
            <IconSymbol name="plus" size={20} color={Colors.light.textOnColor} />
            <Text style={styles.scheduleButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {scheduledVideos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="calendar" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No scheduled videos</Text>
            <Text style={styles.emptySubtext}>
              Schedule approved videos for specific dates and times.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setScheduleModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Schedule Videos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.videoList}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            {sortedDates.map((dateString) => (
              <View key={dateString} style={styles.dateSection}>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <LinearGradient
                    colors={Gradients.purpleBlue}
                    style={styles.dateHeaderGradient}
                  >
                    <Ionicons name="calendar-outline" size={20} color={Colors.light.textOnColor} />
                    <Text style={styles.dateHeaderText}>
                      {formatDateHeader(dateString)}
                    </Text>
                    <View style={styles.videoCountBadge}>
                      <Text style={styles.videoCountText}>
                        {groupedVideos[dateString].length}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Videos for this date */}
                {groupedVideos[dateString].map((video) => (
                  <View key={video.id} style={styles.scheduledVideoWrapper}>
                    <ScheduledVideoCard video={video} />
                    {/* Child indicator */}
                    <View style={styles.childIndicator}>
                      <View style={styles.childAvatarSmall}>
                        <Text style={styles.childAvatarText}>
                          {video.childName && video.childName.charAt ? video.childName.charAt(0).toUpperCase() : 'C'}
                        </Text>
                      </View>
                      <Text style={styles.childNameText}>For {video.childName || 'Child'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderAnalytics = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Analytics Stats */}
      <View style={styles.analyticsSection}>
        <Text style={styles.sectionTitle}>Analytics Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="clock.fill"
            title="Watch Time"
            value={`${Math.floor(stats.totalWatchTime / 60)}h`}
            subtitle={`${stats.totalWatchTime % 60}m this week`}
            color={ThemeColors.analytics.watchTime}
          />
          <StatCard
            icon="star.fill"
            title="Completion"
            value={`${stats.watchRate}%`}
            subtitle="Average completion rate"
            color={ThemeColors.analytics.completion}
          />
        </View>
      </View>

      {/* Favorite Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Favorite Categories</Text>
        {stats.favoriteCategories.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{category.category}</Text>
            <View style={styles.categoryBarContainer}>
              <View
                style={[
                  styles.categoryBar,
                  {
                    width: `${(category.count / Math.max(...stats.favoriteCategories.map(c => c.count))) * 100}%`,
                    backgroundColor: [
                      ThemeColors.analytics.categories,
                      ThemeColors.analytics.progress,
                      ThemeColors.analytics.activity,
                      ThemeColors.analytics.watchTime,
                      ThemeColors.charts.accent
                    ][index % 5]
                  }
                ]}
              />
            </View>
            <Text style={styles.categoryCount}>{category.count}</Text>
          </View>
        ))}
      </View>

      {/* Weekly Progress */}
      <View style={styles.weeklySection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weeklyChart}>
          {stats.weeklyProgress.map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <View style={styles.dayBar}>
                <View
                  style={[
                    styles.dayBarFill,
                    {
                      height: `${Math.max(10, (day.videos / Math.max(...stats.weeklyProgress.map(d => d.videos))) * 100)}%`,
                      backgroundColor: ThemeColors.charts.primary
                    }
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{day.day}</Text>
              <Text style={styles.dayCount}>{day.videos}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Children Stats */}
      <View style={styles.childrenStatsSection}>
        <Text style={styles.sectionTitle}>Children Progress</Text>
        {stats.childrenStats.map((child) => (
          <View key={child.childId} style={styles.childStatsCard}>
            <View style={styles.childStatsHeader}>
              <Text style={styles.childStatsName}>{child.childName}</Text>
              <Text style={styles.childStatsCategory}>{child.favoriteCategory}</Text>
            </View>
            <View style={styles.childStatsRow}>
              <Text style={styles.childStatsLabel}>Videos Watched:</Text>
              <Text style={styles.childStatsValue}>{child.watchedVideos}</Text>
            </View>
            <View style={styles.childStatsRow}>
              <Text style={styles.childStatsLabel}>Total Time:</Text>
              <Text style={styles.childStatsValue}>{Math.floor(child.totalTime / 60)}h {child.totalTime % 60}m</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const StatCard = ({ icon, title, value, subtitle, color }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <IconSymbol name={icon} size={18} color={color} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ChildCard = ({ child }: { child: Child }) => (
    <View style={styles.childCard}>
      <View style={styles.childHeader}>
        <Text style={styles.childName}>{child.name}</Text>
        <View style={styles.ageBadge}>
          <Text style={styles.ageText}>
            {calculateAge(child.birthday)} years old
          </Text>
        </View>
      </View>

      <Text style={styles.interestsLabel}>Interests:</Text>
      <View style={styles.interestsContainer}>
        {child.interests.map((interest, index) => (
          <View key={index} style={styles.interestTag}>
            <Text style={styles.interestText}>{interest}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const VideoRecommendationCard = ({ video, onApprove, onPress }: {
    video: VideoRecommendation;
    onApprove: () => void;
    onPress: () => void;
  }) => {
    const isApproving = approvingVideos.has(video.id);

    return (
      <TouchableOpacity style={styles.gridVideoCard} onPress={onPress}>
        <Image source={{ uri: video.thumbnail }} style={styles.gridVideoThumbnail} />
        <View style={styles.gridVideoOverlay}>
          <Text style={styles.gridVideoDuration}>{video.duration}</Text>
        </View>
        <View style={styles.gridVideoInfo}>
          <Text style={styles.gridVideoTitle} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.gridVideoChannel} numberOfLines={1}>{video.channelName}</Text>
          <View style={styles.gridVideoActions}>
            <TouchableOpacity
              style={[styles.gridApproveButton, isApproving && styles.gridApproveButtonApproving]}
              onPress={(e) => {
                e.stopPropagation();
                if (!isApproving) {
                  onApprove();
                }
              }}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.light.textOnColor} />
                  <Text style={styles.gridApproveButtonText}>Approved!</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="hand.thumbsup" size={12} color={Colors.light.textOnColor} />
                  <Text style={styles.gridApproveButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridInfoButton} onPress={onPress}>
              <IconSymbol name="info.circle" size={14} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ApprovedVideoCard = ({ video, onRemove }: {
    video: ApprovedVideo;
    onRemove: () => void;
  }) => (
    <View style={styles.videoCard}>
      <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.videoChannel}>{video.channelName}</Text>
        <Text style={styles.videoChild}>For: {video.child.name}</Text>
        <View style={styles.videoActions}>
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <IconSymbol name="trash" size={16} color={Colors.light.textOnColor} />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ScheduledVideoCard = ({ video }: { video: ScheduledVideo }) => (
    <View style={styles.videoCard}>
      <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.videoChannel}>By: {video.channelName}</Text>
        <Text style={styles.videoChild}>For: {video.childName}</Text>
        <Text style={styles.videoSchedule}>Scheduled: {new Date(video.scheduledDate).toLocaleDateString()}</Text>
        {video.isWatched && (
          <View style={styles.watchedBadge}>
            <Text style={styles.watchedText}>✓ Watched</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="analytics" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.loadingText}>Loading parent dashboard...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === TabType.OVERVIEW && styles.bottomTabItemActive]}
          onPress={() => setActiveTab(TabType.OVERVIEW)}
        >
          <Ionicons
            name={activeTab === TabType.OVERVIEW ? "home" : "home-outline"}
            size={24}
            color={activeTab === TabType.OVERVIEW ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text style={[styles.bottomTabText, activeTab === TabType.OVERVIEW && styles.bottomTabTextActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === TabType.RECOMMENDATIONS && styles.bottomTabItemActive]}
          onPress={() => setActiveTab(TabType.RECOMMENDATIONS)}
        >
          <Ionicons
            name={activeTab === TabType.RECOMMENDATIONS ? "search" : "search-outline"}
            size={24}
            color={activeTab === TabType.RECOMMENDATIONS ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text style={[styles.bottomTabText, activeTab === TabType.RECOMMENDATIONS && styles.bottomTabTextActive]}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === TabType.APPROVED && styles.bottomTabItemActive]}
          onPress={() => setActiveTab(TabType.APPROVED)}
        >
          <Ionicons
            name={activeTab === TabType.APPROVED ? "thumbs-up" : "thumbs-up-outline"}
            size={24}
            color={activeTab === TabType.APPROVED ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text style={[styles.bottomTabText, activeTab === TabType.APPROVED && styles.bottomTabTextActive]}>Approved</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === TabType.SCHEDULE && styles.bottomTabItemActive]}
          onPress={() => setActiveTab(TabType.SCHEDULE)}
        >
          <Ionicons
            name={activeTab === TabType.SCHEDULE ? "calendar" : "calendar-outline"}
            size={24}
            color={activeTab === TabType.SCHEDULE ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text style={[styles.bottomTabText, activeTab === TabType.SCHEDULE && styles.bottomTabTextActive]}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === TabType.ANALYTICS && styles.bottomTabItemActive]}
          onPress={() => setActiveTab(TabType.ANALYTICS)}
        >
          <Ionicons
            name={activeTab === TabType.ANALYTICS ? "bar-chart" : "bar-chart-outline"}
            size={24}
            color={activeTab === TabType.ANALYTICS ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text style={[styles.bottomTabText, activeTab === TabType.ANALYTICS && styles.bottomTabTextActive]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <ParentScheduleModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        onSchedule={async (videoIds, childrenIds, date) => {
          try {
            const token = await getToken();
            if (!token) {
              Alert.alert('Error', 'Authentication required');
              return;
            }

            const response = await fetch(`${getApiBaseUrl()}/api/scheduled-videos`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                approvedVideoIds: videoIds,
                childrenIds,
                scheduledDate: date,
              }),
            });
            if (response.ok) {
              Alert.alert('Success', 'Videos scheduled successfully! 📅');
              await loadScheduledVideos();
              setScheduleModalVisible(false);
            } else {
              const errorData = await response.json();
              console.error('❌ Schedule videos error:', errorData);
              Alert.alert('Error', errorData.error || 'Failed to schedule videos');
            }
          } catch (error) {
            console.error('❌ Schedule videos network error:', error);
            Alert.alert('Error', 'Failed to schedule videos. Please check your connection.');
          }
        }}
      />

      <ParentAnalyticsModal
        visible={analyticsModalVisible}
        onClose={() => setAnalyticsModalVisible(false)}
      />

      {/* Video Detail Modal */}
      {selectedVideo && (
        <Modal
          visible={videoDetailModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setVideoDetailModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setVideoDetailModalVisible(false)}
              >
                <IconSymbol name="xmark" size={24} color={Colors.light.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Video Details</Text>
              <TouchableOpacity
                style={styles.modalApproveButton}
                onPress={() => {
                  approveVideo(selectedVideo);
                  setVideoDetailModalVisible(false);
                }}
              >
                <IconSymbol name="hand.thumbsup" size={20} color={Colors.light.textOnColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedVideo.thumbnail }} style={styles.modalVideoThumbnail} />

              <View style={styles.modalVideoInfo}>
                <Text style={styles.modalVideoTitle}>{selectedVideo.title}</Text>
                <Text style={styles.modalVideoChannel}>{selectedVideo.channelName}</Text>

                <View style={styles.modalVideoMeta}>
                  <Text style={styles.modalVideoDuration}>{selectedVideo.duration}</Text>
                  <Text style={styles.modalVideoViews}>{parseInt(selectedVideo.viewCount).toLocaleString()} views</Text>
                  <Text style={styles.modalVideoCategory}>{selectedVideo.category}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>AI Summary</Text>
                  <Text style={styles.modalVideoSummary}>
                    {videoSummary || 'Loading summary...'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalVideoDescription}>
                    {selectedVideo.description || 'No description available'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => {
          setFilterModalVisible(false);
          resetPaginationAndLoadRecommendations(true); // Clear cache when filters change
        }}
        selectedChild={children.find(c => c.id === selectedChildId) || null}
        filters={getCurrentFilters()}
        onFiltersChange={setAllFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingBottom: 34, // Safe area for iPhone
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomTabItemActive: {
    // Active state styling handled by icon and text colors
  },
  bottomTabText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  bottomTabTextActive: {
    color: Colors.light.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.semibold,
  },
  welcomeSection: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 20,
    padding: 24,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textOnColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  statTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
  },
  statSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.light.textTertiary,
    marginTop: 4,
    fontFamily: Fonts.content.regular,
  },
  actionsSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textOnColor,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  childrenSection: {
    paddingHorizontal: 24,
  },
  childCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childName: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
  },
  ageBadge: {
    backgroundColor: Colors.light.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ageText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.secondary,
  },
  interestsLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  interestText: {
    fontSize: FontSizes.xs,
    color: Colors.light.primary,
    fontFamily: Fonts.content.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textOnColor,
  },
  selectorSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  selectorLabel: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textPrimary,
    marginBottom: 12,
  },
  childSelector: {
    flexDirection: 'row',
  },
  childSelectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 12,
  },
  childSelectorItemActive: {
    backgroundColor: Colors.light.primary,
  },
  childSelectorText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
  },
  childSelectorTextActive: {
    color: Colors.light.textOnColor,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textPrimary,
    marginLeft: 12,
  },
  searchButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  videoList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  videoThumbnail: {
    width: 120,
    height: 68,
    borderRadius: 8,
    marginRight: 16,
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  videoChannel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textTertiary,
    marginBottom: 8,
  },
  videoChild: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  videoSchedule: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  videoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  approveButtonText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textOnColor,
    marginLeft: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textOnColor,
    marginLeft: 4,
  },
  watchedBadge: {
    backgroundColor: Colors.light.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  watchedText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.success,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  scheduleTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scheduleButtonText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textOnColor,
    marginLeft: 8,
  },
  analyticsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  categoriesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textPrimary,
    width: 80,
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    marginHorizontal: 16,
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCount: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  weeklySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingVertical: 16,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayBar: {
    width: 20,
    height: 80,
    backgroundColor: Colors.light.border,
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dayBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  dayCount: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
  },
  childrenStatsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  childStatsCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  childStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childStatsName: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
  },
  childStatsCategory: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.primary,
  },
  childStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  childStatsLabel: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
  },
  childStatsValue: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textPrimary,
  },
  filtersSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  filtersContainer: {
    flexGrow: 0,
  },
  filterGroup: {
    marginRight: 24,
    minWidth: width * 0.4,
  },
  filterLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.light.textOnColor,
  },
  categoryIcon: {
    fontSize: FontSizes.sm,
    marginRight: 4,
  },
  ageGroupBanner: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#E0F0FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginVertical: 16,
  },
  ageGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ageGroupIcon: {
    backgroundColor: '#E0F0FF',
    borderRadius: 16,
    padding: 4,
    marginRight: 8,
  },
  ageGroupTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.ui.semibold,
    color: Colors.light.primary,
    flex: 1,
  },
  ageGroupDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  ageGroupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ageGroupTag: {
    backgroundColor: '#E0F0FF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  ageGroupTagText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.medium,
    color: Colors.light.primary,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  videoViews: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
  },
  videoSummary: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.ui.semibold,
    color: Colors.light.textPrimary,
  },
  modalApproveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalContent: {
    flex: 1,
  },
  modalVideoThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.light.border,
  },
  modalVideoInfo: {
    padding: 24,
  },
  modalVideoTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    marginBottom: 8,
    lineHeight: 28,
  },
  modalVideoChannel: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  modalVideoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  modalVideoDuration: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.primary,
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalVideoViews: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
  },
  modalVideoCategory: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.secondary,
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.ui.semibold,
    color: Colors.light.textPrimary,
    marginBottom: 12,
  },
  modalVideoSummary: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textPrimary,
    lineHeight: 22,
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  modalVideoDescription: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  // New Browse Section Styles
  browseContainer: {
    flex: 1,
  },
  browseHeader: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  compactChildSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactSelectorLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  childScrollView: {
    flex: 1,
  },
  compactChildChip: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  compactChildChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  compactChildChipText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.textPrimary,
  },
  compactChildChipTextActive: {
    color: Colors.light.textOnColor,
  },
  compactAgeInfo: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  compactAgeText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.regular,
    color: Colors.light.primary,
    textAlign: 'center',
  },
  browseSearchSection: {
    marginBottom: 12,
  },
  browseSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  browseSearchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textPrimary,
    marginHorizontal: 8,
  },
  filterButton: {
    padding: 4,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  activeFiltersLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  activeFiltersScroll: {
    flex: 1,
  },
  activeFilterChip: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  activeFilterText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.medium,
    color: Colors.light.textOnColor,
  },
  videoGridContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  videoGridRow: {
    justifyContent: 'space-between',
  },
  gridVideoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    width: (width - 48) / 2,
  },
  gridVideoThumbnail: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.light.border,
  },
  gridVideoOverlay: {
    position: 'absolute',
    bottom: 55,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  gridVideoDuration: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.semibold,
    color: 'white',
  },
  gridVideoInfo: {
    padding: 8,
  },
  gridVideoTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textPrimary,
    marginBottom: 4,
    lineHeight: 16,
  },
  gridVideoChannel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  gridVideoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  gridApproveButtonText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textOnColor,
    marginLeft: 4,
  },
  gridInfoButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 16,
    padding: 6,
  },
  rateLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error + '15',
    borderWidth: 1,
    borderColor: Colors.light.error + '30',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  rateLimitText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.error,
    marginLeft: 8,
    flex: 1,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  loadMoreButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loadMoreText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textOnColor,
    marginLeft: 8,
  },
  loadingMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingMoreText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.medium,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  loadingRecommendationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  progressiveLoaderCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    maxWidth: 320,
  },
  progressiveLoaderContent: {
    alignItems: 'center',
  },
  progressiveLoaderIcon: {
    marginBottom: 20,
    transform: [{ scale: 1.2 }],
  },
  progressiveLoaderTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressiveLoaderSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  progressiveLoaderSteps: {
    width: '100%',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.border,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  stepIndicatorActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  stepText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.textTertiary,
    flex: 1,
  },
  stepTextActive: {
    color: Colors.light.textPrimary,
    fontFamily: Fonts.content.semibold,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeaderText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textOnColor,
    marginLeft: 8,
    flex: 1,
  },
  videoCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  videoCountText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textOnColor,
  },
  scheduledVideoWrapper: {
    marginBottom: 8,
    position: 'relative',
  },
  childIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  childAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  childAvatarText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textOnColor,
  },
  childNameText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
  },
  historyButton: {
    padding: 8,
    marginLeft: 4,
  },
  searchSuggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionHeader: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textTertiary,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  suggestionText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  clearHistoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearHistoryText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.error,
  },
  gridApproveButtonApproving: {
    backgroundColor: Colors.light.success,
  },
  refreshVideosButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
});