import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient, Child } from '@/lib/api';
import { calculateAge } from '@/lib/utils';
import { useChild } from '@/contexts/ChildContext';
import { Colors, Gradients } from '@/constants/Colors';
import { Fonts, FontSizes } from '@/constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';

const AVATAR_COLORS = [
  Colors.light.primary, Colors.light.secondary, Colors.light.blue, 
  Colors.light.yellow, Colors.light.green, Colors.light.orange
];


export default function MainDashboard() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const { setSelectedChild } = useChild();
  
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await loadChildren();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadChildren = async () => {
    try {
      console.log('Loading children data from API...');
      
      // Try to load from API first
      try {
        const token = await getToken();
        if (token) {
          const childrenData = await apiClient.getChildren(token);
          setChildren(childrenData);
          console.log('✅ Loaded children from API:', childrenData.length);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError);
      }
      
      // Fallback to mock data
      const mockChildren: Child[] = [
        {
          id: '1',
          parentId: 'mock',
          name: 'Emma',
          birthday: new Date(2017, 0, 15).toISOString(),
          interests: ['animals', 'music', 'art'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          parentId: 'mock',
          name: 'Liam',
          birthday: new Date(2019, 6, 20).toISOString(),
          interests: ['cars', 'sports', 'science'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      setChildren(mockChildren);
      console.log('✅ Using mock children data');
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              setSelectedChild(null);
              router.replace('/auth');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  const selectChild = (child: Child) => {
    setSelectedChild(child);
    router.replace('/(tabs)');
  };

  const addChild = () => {
    Alert.alert('Coming Soon', 'Add child functionality will be available soon');
  };

  const navigateToParentDashboard = () => {
    console.log('🎯 Navigating to parent dashboard...');
    router.push('/parent-dashboard');
  };


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingSpinner}>
            <Ionicons name="people-circle" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome to Kids Land! 🎈</Text>
              <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Profile Selection */}
        <View style={styles.childrenSection}>
          <Text style={styles.sectionTitle}>Select Profile</Text>
          <Text style={styles.sectionSubtitle}>Choose a profile to continue</Text>
          
          <View style={styles.profileGrid}>
            {/* Parent Profile Card */}
            <TouchableOpacity
              style={styles.profileCard}
              onPress={navigateToParentDashboard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.sunset}
                style={styles.profileGradient}
              >
                <View style={styles.profileContent}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color={Colors.light.textOnColor} />
                  </View>
                  <Text style={styles.profileName}>Parent Dashboard</Text>
                  <View style={styles.ageContainer}>
                    <Text style={styles.profileAge}>Manage & Monitor</Text>
                    <Ionicons name="settings" size={16} color="rgba(255,255,255,0.8)" />
                  </View>
                  <View style={styles.playButton}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {children.map((child, index) => {
              const gradientColors = [Gradients.primaryPurple, Gradients.primaryPink, Gradients.ocean][index % 3];
              
              return (
                <TouchableOpacity
                  key={child.id}
                  style={styles.profileCard}
                  onPress={() => selectChild(child)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.profileGradient}
                  >
                    <View style={styles.profileContent}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(child.name)}</Text>
                      </View>
                      <Text style={styles.profileName}>{child.name}</Text>
                      <View style={styles.ageContainer}>
                        <Text style={styles.profileAge}>Age {calculateAge(child.birthday)}</Text>
                        <Ionicons name="star" size={16} color="rgba(255,255,255,0.8)" />
                      </View>
                      <View style={styles.playButton}>
                        <Ionicons name="play" size={20} color={Colors.light.primary} />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.addProfileCard} onPress={addChild} activeOpacity={0.8}>
              <View style={styles.addProfileContent}>
                <View style={styles.addAvatar}>
                  <Ionicons name="add" size={32} color={Colors.light.primary} />
                </View>
                <Text style={styles.addProfileText}>Add Child</Text>
                <Text style={styles.addProfileSubtext}>Create new profile</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
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

  // Header
  header: {
    paddingTop: 10,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },

  // Profile Section
  childrenSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  profileCard: {
    width: '47%',
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileGradient: {
    borderRadius: 20,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textOnColor,
  },
  profileName: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textOnColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileAge: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 4,
  },
  playButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addProfileCard: {
    width: '47%',
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  addProfileContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  addAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addProfileText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  addProfileSubtext: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});