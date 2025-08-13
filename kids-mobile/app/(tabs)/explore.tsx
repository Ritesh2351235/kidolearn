import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { Colors, Gradients } from '@/constants/Colors';
import { Fonts, FontSizes } from '@/constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';

export default function ExploreScreen() {
  const { selectedChild } = useChild();

  const categories = [
    { id: 1, name: 'Science', icon: 'flask', color: '#10B981' },
    { id: 2, name: 'Music', icon: 'musical-notes', color: '#F59E0B' },
    { id: 3, name: 'Stories', icon: 'book', color: '#EF4444' },
    { id: 4, name: 'Animals', icon: 'paw', color: '#8B5CF6' },
    { id: 5, name: 'Art & Craft', icon: 'brush', color: '#F97316' },
    { id: 6, name: 'Sports', icon: 'football', color: '#06B6D4' },
  ];

  if (!selectedChild) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Discover new topics, {selectedChild.name}!</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coming Soon Section */}
        <View style={styles.comingSoonContainer}>
          <View style={styles.comingSoonIcon}>
            <Ionicons name="sparkles" size={48} color="#A78BFA" />
          </View>
          <Text style={styles.comingSoonTitle}>Discovery Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            We're building amazing features to help you discover new educational content based on your interests.
          </Text>
        </View>

        {/* Categories Preview */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories We're Working On</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard} disabled>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features Coming */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features Coming Soon</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="search" size={20} color="#A78BFA" />
              </View>
              <Text style={styles.featureText}>Search for videos by topic</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="star" size={20} color="#A78BFA" />
              </View>
              <Text style={styles.featureText}>Personalized recommendations</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="trophy" size={20} color="#A78BFA" />
              </View>
              <Text style={styles.featureText}>Learning achievements</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="heart" size={20} color="#A78BFA" />
              </View>
              <Text style={styles.featureText}>Favorite videos collection</Text>
            </View>
          </View>
        </View>

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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: FontSizes['4xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FontSizes.lg,
    color: Colors.light.textSecondary,
    fontFamily: Fonts.content.semibold,
  },
  content: {
    flex: 1,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  comingSoonIcon: {
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: FontSizes.lg,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Fonts.content.regular,
  },
  categoriesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    opacity: 0.6,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
});
