/**
 * Kids-friendly color palette inspired by playful learning apps
 * Features bright, engaging colors with purple gradients and pink accents
 */

// Primary brand colors
const primaryPurple = '#8B5CF6';
const primaryPurpleLight = '#A855F7';
const primaryPink = '#EC4899';
const primaryPinkLight = '#F472B6';

// Secondary colors
const secondaryBlue = '#3B82F6';
const secondaryGreen = '#10B981';
const secondaryYellow = '#F59E0B';
const secondaryOrange = '#F97316';

// Neutral colors
const white = '#FFFFFF';
const lightGray = '#F8FAFC';
const mediumGray = '#64748B';
const darkGray = '#334155';

export const Colors = {
  light: {
    text: '#1E293B',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    tint: primaryPurple,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: primaryPurple,
    
    // Brand colors
    primary: primaryPurple,
    primaryLight: primaryPurpleLight,
    secondary: primaryPink,
    secondaryLight: primaryPinkLight,
    
    // Accent colors
    blue: secondaryBlue,
    green: secondaryGreen,
    yellow: secondaryYellow,
    orange: secondaryOrange,
    
    // UI colors
    cardBackground: white,
    border: '#E2E8F0',
    success: secondaryGreen,
    warning: secondaryYellow,
    error: '#EF4444',
    
    // Text colors
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textOnColor: white,
  },
  dark: {
    text: '#F1F5F9',
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    tint: primaryPurpleLight,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: primaryPurpleLight,
    
    // Brand colors
    primary: primaryPurpleLight,
    primaryLight: '#C084FC',
    secondary: primaryPinkLight,
    secondaryLight: '#FBBF24',
    
    // Accent colors
    blue: '#60A5FA',
    green: '#34D399',
    yellow: '#FBBF24',
    orange: '#FB923C',
    
    // UI colors
    cardBackground: '#1E293B',
    border: '#334155',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    
    // Text colors
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textOnColor: white,
  },
};

// Gradient definitions for easy reuse
export const Gradients = {
  primaryPurple: ['#8B5CF6', '#A855F7'],
  primaryPink: ['#EC4899', '#F472B6'],
  rainbow: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
  sunset: ['#F97316', '#F59E0B', '#EC4899'],
  ocean: ['#3B82F6', '#10B981'],
};
