import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors, ThemeColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { API_ENDPOINTS } from '@/constants/Api';
import { useAuth } from '@clerk/clerk-expo';
import { getApiBaseUrl } from '@/lib/productionConfig';

// Updated to match web app analytics data structure
interface AnalyticsOverview {
  totalActivities: number;
  totalSessions: number;
  totalWatchTimeSeconds: number;
  averageCompletionRate: number;
  uniqueVideosWatched: number;
  totalSessionTimeSeconds: number;
  averageSessionTimeSeconds: number;
}

interface MostWatchedVideo {
  youtubeId: string;
  title: string;
  channelName: string;
  watchCount: number;
  totalWatchTimeSeconds: number;
}

interface DailyActivity {
  date: string;
  activities_count: number;
  total_watch_time: number;
  unique_videos: number;
}

interface Child {
  id: string;
  name: string;
  birthday: string;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  mostWatchedVideos: MostWatchedVideo[];
  dailyActivity: DailyActivity[];
  children: Child[];
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

interface ParentAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ParentAnalyticsModal({ visible, onClose }: ParentAnalyticsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { getToken } = useAuth();

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Overview, 1: Videos, 2: Children

  useEffect(() => {
    if (visible) {
      loadAnalyticsData();
    }
  }, [visible]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading analytics data from web app API...');

      const token = await getToken();
      if (!token) {
        console.log('❌ No auth token available');
        return;
      }

      // Use the advanced analytics API from web app (7-day default)
      const params = new URLSearchParams({
        days: '7', // Last 7 days of data
        // Can add childId filter if needed: childId: 'specific-child-id'
      });

      const response = await fetch(`${getApiBaseUrl()}/api/parent/analytics?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Analytics API response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics data loaded:', {
          totalActivities: data.overview.totalActivities,
          totalWatchTime: Math.floor(data.overview.totalWatchTimeSeconds / 60),
          mostWatchedVideos: data.mostWatchedVideos.length,
          dailyActivity: data.dailyActivity.length,
          children: data.children.length
        });
        setAnalyticsData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Analytics API error:', response.status, errorData);

        // Set empty but valid data structure instead of mock data
        setAnalyticsData({
          overview: {
            totalActivities: 0,
            totalSessions: 0,
            totalWatchTimeSeconds: 0,
            averageCompletionRate: 0,
            uniqueVideosWatched: 0,
            totalSessionTimeSeconds: 0,
            averageSessionTimeSeconds: 0
          },
          mostWatchedVideos: [],
          topChannels: [],
          dailyActivity: [],
          activityBreakdown: [],
          children: [],
          dateRange: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            days: 7
          }
        });
      }
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
      // Keep existing data or show error state
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return minutes > 0 ? `${minutes}m` : `${Math.floor(seconds)}s`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const TabButton = ({ title, index, icon }: { title: string; index: number; icon: string }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 3,
        borderBottomColor: selectedTab === index ? colors.primary : 'transparent',
        alignItems: 'center'
      }}
      onPress={() => setSelectedTab(index)}
      activeOpacity={0.7}
    >
      <IconSymbol
        name={icon}
        size={20}
        color={selectedTab === index ? colors.primary : colors.textTertiary}
        style={{ marginBottom: 4 }}
      />
      <Text style={{
        fontSize: 14,
        fontWeight: selectedTab === index ? '600' : '400',
        color: selectedTab === index ? colors.primary : colors.textTertiary,
        fontFamily: selectedTab === index ? 'Poppins_600SemiBold' : 'Poppins_400Regular'
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: string;
  }) => (
    <View style={{
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
      marginHorizontal: 6
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{
          backgroundColor: color + '20',
          borderRadius: 12,
          padding: 8,
          marginRight: 12
        }}>
          <IconSymbol name={icon} size={20} color={color} />
        </View>
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
          fontFamily: 'Poppins_600SemiBold',
          flex: 1
        }}>
          {title}
        </Text>
      </View>
      <Text style={{
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        fontFamily: 'Poppins_800ExtraBold'
      }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 11,
          color: colors.textTertiary,
          marginTop: 4,
          fontFamily: 'Poppins_400Regular'
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 24, marginHorizontal: -6 }}>
          <StatCard
            title="Total Watch Time"
            value={formatTime(analyticsData.overview.totalWatchTimeSeconds)}
            subtitle={`${analyticsData.dateRange.days} days`}
            icon="clock.fill"
            color={ThemeColors.analytics.watchTime}
          />
          <StatCard
            title="Total Activities"
            value={analyticsData.overview.totalActivities.toString()}
            subtitle="Video interactions"
            icon="play.circle.fill"
            color={ThemeColors.analytics.activity}
          />
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 24, marginHorizontal: -6 }}>
          <StatCard
            title="Unique Videos"
            value={analyticsData.overview.uniqueVideosWatched.toString()}
            subtitle="Different videos watched"
            icon="tv.fill"
            color={ThemeColors.analytics.progress}
          />
          <StatCard
            title="Completion Rate"
            value={`${Math.round(analyticsData.overview.averageCompletionRate)}%`}
            subtitle="Videos completed"
            icon="checkmark.circle.fill"
            color={ThemeColors.analytics.completion}
          />
        </View>

        {/* Daily Activity Chart */}
        <View style={{
          backgroundColor: colors.cardBackground,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.border
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.textPrimary,
            fontFamily: 'Poppins_700Bold',
            marginBottom: 16
          }}>
            Daily Activity
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'end' }}>
            {analyticsData.dailyActivity.map((day, index) => {
              const maxActivities = Math.max(...analyticsData.dailyActivity.map(d => d.activities_count));
              const height = Math.max((day.activities_count / maxActivities) * 60, 8);

              return (
                <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: 20,
                    height: height,
                    backgroundColor: ThemeColors.charts.primary,
                    borderRadius: 4,
                    marginBottom: 8
                  }} />
                  <Text style={{
                    fontSize: 10,
                    color: colors.textSecondary,
                    fontFamily: 'Poppins_400Regular',
                    marginBottom: 2
                  }}>
                    {getDayName(day.date)}
                  </Text>
                  <Text style={{
                    fontSize: 9,
                    color: colors.textTertiary,
                    fontFamily: 'Poppins_600SemiBold'
                  }}>
                    {day.activities_count}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={{
            fontSize: 12,
            color: colors.textTertiary,
            fontFamily: 'Poppins_400Regular',
            marginTop: 8,
            textAlign: 'center'
          }}>
            Total: {analyticsData.dailyActivity.reduce((sum, day) => sum + day.activities_count, 0)} activities
          </Text>
        </View>

        {/* Session Stats */}
        <View style={{
          backgroundColor: colors.cardBackground,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.textPrimary,
            fontFamily: 'Poppins_700Bold',
            marginBottom: 16
          }}>
            Session Statistics
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: colors.textPrimary,
                fontFamily: 'Poppins_800ExtraBold'
              }}>
                {analyticsData.overview.totalSessions}
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular'
              }}>
                Total Sessions
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: colors.textPrimary,
                fontFamily: 'Poppins_800ExtraBold'
              }}>
                {formatTime(analyticsData.overview.averageSessionTimeSeconds)}
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular'
              }}>
                Avg Session
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderVideosTab = () => {
    if (!analyticsData) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.textPrimary,
          fontFamily: 'Poppins_700Bold',
          marginBottom: 16
        }}>
          Most Watched Videos
        </Text>

        {analyticsData.mostWatchedVideos.slice(0, 5).map((video, index) => (
          <View key={video.youtubeId} style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            {/* Rank */}
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: index < 3 ? ThemeColors.charts.primary : colors.textTertiary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#FFFFFF',
                fontFamily: 'Poppins_700Bold'
              }}>
                {index + 1}
              </Text>
            </View>

            {/* Video Info */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.textPrimary,
                fontFamily: 'Poppins_600SemiBold',
                marginBottom: 2
              }} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular',
                marginBottom: 4
              }}>
                {video.channelName}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{
                  fontSize: 12,
                  color: colors.textTertiary,
                  fontFamily: 'Poppins_600SemiBold'
                }}>
                  {video.watchCount} views
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: colors.textTertiary,
                  fontFamily: 'Poppins_400Regular'
                }}>
                  {formatTime(video.totalWatchTimeSeconds)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {analyticsData.mostWatchedVideos.length === 0 && (
          <View style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center'
          }}>
            <IconSymbol name="tv.fill" size={48} color={colors.textTertiary} />
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
              fontFamily: 'Poppins_600SemiBold',
              marginTop: 12
            }}>
              No video data yet
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textTertiary,
              fontFamily: 'Poppins_400Regular',
              textAlign: 'center',
              marginTop: 4
            }}>
              Start watching videos to see analytics
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderChildrenTab = () => {
    if (!analyticsData) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {analyticsData.children.map((child, index) => {
          // Calculate child age
          const age = Math.floor((Date.now() - new Date(child.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          const colors_array = ThemeColors.avatars;
          const childColor = colors_array[index % colors_array.length];

          return (
            <View key={child.id} style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: childColor + '30',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: childColor,
                    fontFamily: 'Poppins_700Bold'
                  }}>
                    {child.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    fontFamily: 'Poppins_700Bold'
                  }}>
                    {child.name}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontFamily: 'Poppins_400Regular'
                  }}>
                    {age} years old
                  </Text>
                </View>
              </View>

              {/* Child-specific analytics would go here */}
              <Text style={{
                fontSize: 14,
                color: colors.textTertiary,
                fontFamily: 'Poppins_400Regular',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Individual analytics coming soon
              </Text>
            </View>
          );
        })}

        {analyticsData.children.length === 0 && (
          <View style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center'
          }}>
            <IconSymbol name="person.2.fill" size={48} color={colors.textTertiary} />
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
              fontFamily: 'Poppins_600SemiBold',
              marginTop: 12
            }}>
              No children found
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{
        flex: 1,
        backgroundColor: colors.background
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          paddingTop: Platform.OS === 'ios' ? 60 : 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.textPrimary,
            fontFamily: 'Poppins_700Bold'
          }}>
            Analytics
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <TabButton title="Overview" index={0} icon="chart.bar.fill" />
          <TabButton title="Videos" index={1} icon="tv.fill" />
          <TabButton title="Children" index={2} icon="person.2.fill" />
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: 20 }}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{
                fontSize: 16,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular'
              }}>
                Loading analytics...
              </Text>
            </View>
          ) : (
            selectedTab === 0 ? renderOverviewTab() :
              selectedTab === 1 ? renderVideosTab() : renderChildrenTab()
          )}
        </View>
      </View>
    </Modal>
  );
}