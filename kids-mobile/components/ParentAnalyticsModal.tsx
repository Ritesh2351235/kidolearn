import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { API_ENDPOINTS } from '@/constants/Api';

interface AnalyticsData {
  totalWatchTime: number;
  favoriteCategories: { category: string; count: number }[];
  weeklyProgress: { day: string; videos: number }[];
  childrenStats: { 
    childId: string; 
    childName: string; 
    watchedVideos: number; 
    totalTime: number; 
    favoriteCategory: string;
  }[];
}

interface ParentAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ParentAnalyticsModal({ visible, onClose }: ParentAnalyticsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalWatchTime: 0,
    favoriteCategories: [],
    weeklyProgress: [],
    childrenStats: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Overview, 1: Children, 2: Categories

  useEffect(() => {
    if (visible) {
      loadAnalyticsData();
    }
  }, [visible]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.parentAnalytics);
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Mock data for demo
      setAnalyticsData({
        totalWatchTime: 1250,
        favoriteCategories: [
          { category: 'Science', count: 45 },
          { category: 'Math', count: 32 },
          { category: 'Reading', count: 28 },
          { category: 'Art', count: 15 }
        ],
        weeklyProgress: [
          { day: 'Mon', videos: 3 },
          { day: 'Tue', videos: 5 },
          { day: 'Wed', videos: 2 },
          { day: 'Thu', videos: 4 },
          { day: 'Fri', videos: 6 },
          { day: 'Sat', videos: 8 },
          { day: 'Sun', videos: 4 }
        ],
        childrenStats: [
          {
            childId: '1',
            childName: 'Emma',
            watchedVideos: 67,
            totalTime: 680,
            favoriteCategory: 'Science'
          },
          {
            childId: '2',
            childName: 'Liam',
            watchedVideos: 53,
            totalTime: 570,
            favoriteCategory: 'Math'
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Summary Stats */}
      <View style={{ flexDirection: 'row', marginBottom: 24, marginHorizontal: -6 }}>
        <StatCard
          title="Total Watch Time"
          value={formatTime(analyticsData.totalWatchTime)}
          subtitle="This month"
          icon="clock.fill"
          color={colors.primary}
        />
        <StatCard
          title="Videos Watched"
          value={analyticsData.childrenStats.reduce((sum, child) => sum + child.watchedVideos, 0).toString()}
          subtitle="Total"
          icon="play.circle.fill"
          color={colors.secondary}
        />
      </View>

      {/* Weekly Progress */}
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
          Weekly Progress
        </Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'end' }}>
          {analyticsData.weeklyProgress.map((day, index) => {
            const maxVideos = Math.max(...analyticsData.weeklyProgress.map(d => d.videos));
            const height = (day.videos / maxVideos) * 60;
            
            return (
              <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 20,
                  height: Math.max(height, 8),
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                  marginBottom: 8
                }} />
                <Text style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontFamily: 'Poppins_400Regular',
                  marginBottom: 4
                }}>
                  {day.day}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: colors.textTertiary,
                  fontFamily: 'Poppins_600SemiBold'
                }}>
                  {day.videos}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Top Categories */}
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
          Favorite Categories
        </Text>
        
        {analyticsData.favoriteCategories.slice(0, 4).map((category, index) => {
          const maxCount = analyticsData.favoriteCategories[0]?.count || 1;
          const width = (category.count / maxCount) * 100;
          
          return (
            <View key={index} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  fontFamily: 'Poppins_600SemiBold'
                }}>
                  {category.category}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  fontFamily: 'Poppins_400Regular'
                }}>
                  {category.count}
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: colors.border,
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <View style={{
                  width: `${width}%`,
                  height: '100%',
                  backgroundColor: index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.blue,
                  borderRadius: 3
                }} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderChildrenTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {analyticsData.childrenStats.map((child, index) => (
        <View key={child.childId} style={{
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
              backgroundColor: colors.primary + '30',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
              <IconSymbol name="person.fill" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                fontFamily: 'Poppins_700Bold'
              }}>
                {child.childName}
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular'
              }}>
                Favorite: {child.favoriteCategory}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: colors.textPrimary,
                fontFamily: 'Poppins_800ExtraBold'
              }}>
                {child.watchedVideos}
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular'
              }}>
                Videos Watched
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: colors.textPrimary,
                fontFamily: 'Poppins_800ExtraBold'
              }}>
                {formatTime(child.totalTime)}
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular'
              }}>
                Watch Time
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

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
          <TabButton title="Children" index={1} icon="person.2.fill" />
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: 20 }}>
          {selectedTab === 0 ? renderOverviewTab() : renderChildrenTab()}
        </View>
      </View>
    </Modal>
  );
}