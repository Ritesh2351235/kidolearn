import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, Linking } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '@/constants/Colors';
import { Fonts, FontSizes } from '@/constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  useWarmUpBrowser();
  const [showFAQ, setShowFAQ] = useState(false);

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleSignIn = React.useCallback(async () => {
    try {
      console.log('Starting Google OAuth flow...');
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        console.log('OAuth successful, setting active session...');
        await setActive!({ session: createdSessionId });
        
        // Wait longer for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Redirect to main dashboard after successful authentication
        router.replace('/main-dashboard');
      } else {
        // Handle sign-in or sign-up for next steps such as MFA
        console.log('No session created, handling sign-in/sign-up...');
        if (signIn) {
          console.log('Sign-in available, proceeding...');
          // Complete the sign-in process
          await setActive!({ session: signIn.createdSessionId });
          await new Promise(resolve => setTimeout(resolve, 2000));
          router.replace('/main-dashboard');
        } else if (signUp) {
          console.log('Sign-up available, proceeding...');
          // Complete the sign-up process
          await setActive!({ session: signUp.createdSessionId });
          await new Promise(resolve => setTimeout(resolve, 2000));
          router.replace('/main-dashboard');
        }
      }
    } catch (err) {
      console.error('OAuth error during sign-in:', err);
      // Show user-friendly error message
      alert('Authentication failed. Please try again.');
    }
  }, [startOAuthFlow]);

  const handleParentSignUp = async () => {
    try {
      await Linking.openURL('https://riteshhiremath.com');
    } catch (err) {
      console.error('Failed to open URL', err);
    }
  };

  const toggleFAQ = () => {
    setShowFAQ(!showFAQ);
  };

  if (showFAQ) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.faqContainer}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.faqHeader}>
              <TouchableOpacity style={styles.backButton} onPress={toggleFAQ}>
                <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
              </TouchableOpacity>
              <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            </View>

            <View style={styles.faqContent}>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>👨‍👩‍👧‍👦 What is Kids Curator?</Text>
                <Text style={styles.faqAnswer}>
                  Kids Curator is a safe learning platform where parents can curate and approve educational content for their children. 
                  Your kids can only watch videos that you&apos;ve pre-approved, ensuring a safe and educational experience.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>🛡️ How does it work?</Text>
                <Text style={styles.faqAnswer}>
                  1. Parents sign up on our web platform (riteshhiremath.com){'\n'}
                  2. Browse and approve educational content for your children{'\n'}
                  3. Your kids sign in with Google on this mobile app to access approved videos{'\n'}
                  4. Monitor their progress and learning achievements
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>📱 How does the unified app work?</Text>
                <Text style={styles.faqAnswer}>
                  • <Text style={styles.bold}>Children:</Text> Select their profile to watch approved videos{'\n'}
                  • <Text style={styles.bold}>Parents:</Text> Access parent controls to manage content and schedule videos
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>🎯 Why is this better?</Text>
                <Text style={styles.faqAnswer}>
                  Unlike YouTube Kids where algorithms decide content, YOU choose exactly what your children can watch. 
                  No unwanted surprises, no inappropriate recommendations - just the educational content you trust.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>🚀 Getting Started</Text>
                <Text style={styles.faqAnswer}>
                  Simply sign in with Google to access your family dashboard. Create child profiles and start managing their educational content right away.
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.mainContainer}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/app-images/illustrator.png')} 
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome to Kids Land! 🎈</Text>
            <Text style={styles.subtitle}>Safe, curated learning adventures for your children</Text>
          </View>

          {/* Sign In Options */}
          <View style={styles.authSection}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            
            {/* Unified Sign In */}
            <TouchableOpacity style={styles.signInCard} onPress={handleSignIn} activeOpacity={0.9}>
              <LinearGradient
                colors={Gradients.primaryPurple as any}
                style={styles.authCardGradient}
              >
                <View style={styles.authCardContent}>
                  <View style={styles.authIcon}>
                    <Ionicons name="logo-google" size={32} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={styles.authCardTitle}>Sign in with Google</Text>
                  <Text style={styles.authCardSubtitle}>Access your family dashboard with parent controls and children profiles</Text>
                  <View style={styles.playButtonAuth}>
                    <Ionicons name="arrow-forward" size={20} color={Colors.light.primary} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoContent}>
                <Ionicons name="information-circle" size={24} color={Colors.light.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>All-in-One Experience</Text>
                  <Text style={styles.infoSubtitle}>
                    Parents can manage content and children can watch videos - all in one app!
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.helpSection}>
            <TouchableOpacity style={styles.faqButton} onPress={toggleFAQ}>
              <Ionicons name="help-circle" size={20} color={Colors.light.primary} />
              <Text style={styles.faqButtonText}>First time here? Learn how it works</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.light.success} />
              <Text style={styles.securityText}>Safe & Secure Platform</Text>
            </View>
            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  mainContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
    paddingTop: 20,
  },
  logoContainer: {
    width: 200,
    height: 150,
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: FontSizes['4xl'],
    fontFamily: Fonts.content.extrabold,
    color: Colors.light.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontFamily: Fonts.content.semibold,
    maxWidth: 280,
    lineHeight: 24,
  },
  
  // Auth Section
  authSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  authCardGradient: {
    borderRadius: 20,
  },
  authCardContent: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  authIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authCardTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textOnColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  authCardSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  playButtonAuth: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  externalIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Help Section
  helpSection: {
    marginBottom: 32,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  faqButtonText: {
    flex: 1,
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.textPrimary,
    marginLeft: 12,
    marginRight: 8,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.semibold,
    color: Colors.light.success,
    marginLeft: 6,
  },
  terms: {
    fontSize: FontSizes.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: Fonts.content.regular,
    maxWidth: 300,
  },
  
  // FAQ Styles
  faqContainer: {
    flex: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  faqTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.ui.bold,
    color: Colors.light.textPrimary,
    flex: 1,
  },
  faqContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  faqItem: {
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
  faqQuestion: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
    marginBottom: 12,
    lineHeight: 24,
  },
  faqAnswer: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontFamily: Fonts.content.bold,
    color: Colors.light.textPrimary,
  },
});