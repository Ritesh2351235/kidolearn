import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
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

const AVATAR_COLORS = [
  Colors.light.primary, Colors.light.secondary, Colors.light.blue, 
  Colors.light.yellow, Colors.light.green, Colors.light.orange
];

export default function ChildProfilesScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const { setSelectedChild } = useChild();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🚀 [Mobile] Starting new request: children-list');
      
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const childrenData = await apiClient.getChildren(token);
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
      
      // For development, fall back to mock data if API fails
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
      console.log('Using mock data due to API error:', error);
    } finally {
      setLoading(false);
    }
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
              // Clear selected child when signing out
              setSelectedChild(null);
              // Force redirect to auth page
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
    // TODO: Navigate to add child screen
    Alert.alert('Coming Soon', 'Add child functionality will be available soon');
  };

  const getAvatarColor = (index: number) => {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
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
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to Kids Land! 🎈</Text>
            <Text style={styles.title}>Who's ready to learn today?</Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Hero Illustration Section */}
      <View style={styles.heroSection}>
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('../assets/app-images/illustrator.png')} 
            style={styles.heroIllustration}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.heroText}>Choose your profile to start your adventure!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.profilesContainer}>
        <View style={styles.profileGrid}>
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
              <Text style={styles.addProfileText}>Add New Profile</Text>
              <Text style={styles.addProfileSubtext}>Create a new learning adventure</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.light.success} />
          <Text style={styles.footerText}>
            Safe & Secure • {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  header: {
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: Colors.light.background,
  },
  illustrationContainer: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  heroIllustration: {
    width: '100%',
    height: '100%',
  },
  heroText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  profilesContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
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
    width: 70,
    height: 70,
    borderRadius: 35,
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
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textOnColor,
  },
  profileName: {
    fontSize: FontSizes.lg,
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
    width: 70,
    height: 70,
    borderRadius: 35,
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginLeft: 6,
  },
});