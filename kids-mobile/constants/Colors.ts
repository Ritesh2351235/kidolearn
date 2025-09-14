/**
 * Professional purple-white theme for kids learning platform
 * Clean, elegant design with subtle purple accents
 */

// Primary purple theme colors
const primaryPurple = '#8B5CF6';
const primaryPurpleLight = '#A855F7';
const primaryPurpleLighter = '#C084FC';
const primaryPurpleDark = '#7C3AED';

// Subtle accent colors (keeping minimal and professional)
const softPurple = '#F3E8FF';
const lightPurple = '#E9D5FF';
const accentGreen = '#10B981'; // For success states only
const accentRed = '#EF4444'; // For error states only

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

    // Brand colors - focused on purple theme
    primary: primaryPurple,
    primaryLight: primaryPurpleLight,
    secondary: primaryPurpleLighter,
    secondaryLight: lightPurple,

    // Minimal accent colors - only essential ones
    success: accentGreen,
    warning: primaryPurple, // Use purple instead of bright yellow
    error: accentRed,

    // UI colors
    cardBackground: white,
    border: '#E2E8F0',

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

    // Brand colors - focused on purple theme
    primary: primaryPurpleLight,
    primaryLight: primaryPurpleLighter,
    secondary: primaryPurpleLighter,
    secondaryLight: lightPurple,

    // Minimal accent colors - only essential ones
    success: '#34D399',
    warning: primaryPurpleLight, // Use purple instead of bright yellow
    error: '#F87171',

    // UI colors
    cardBackground: '#1E293B',
    border: '#334155',

    // Text colors
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textOnColor: white,
  },
};

// Professional color palette for different UI elements
export const ThemeColors = {
  // Profile avatar colors - balanced variety with purple theme
  avatars: [
    '#8B5CF6', // Primary purple
    '#10B981', // Emerald green (fresh, growth-oriented)
    '#6366F1', // Indigo (tech-friendly, calm)
    '#F59E0B', // Amber (warm, energetic)
    '#EF4444', // Red (vibrant, playful)
    '#06B6D4', // Cyan (cool, modern)
  ],

  // Analytics stat colors - professional and distinct
  analytics: {
    watchTime: '#8B5CF6',      // Primary purple for time-based stats
    completion: '#10B981',     // Green for completion/success
    activity: '#6366F1',       // Indigo for activity stats
    progress: '#A855F7',       // Light purple for progress
    children: '#7C3AED',       // Dark purple for children stats
    categories: '#C084FC',     // Light purple for categories
  },

  // Chart and visualization colors
  charts: {
    primary: '#8B5CF6',
    secondary: '#A855F7',
    tertiary: '#C084FC',
    accent: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
  }
};

// Gradient definitions for easy reuse - Balanced theme with variety
export const Gradients = {
  primaryPurple: ['#8B5CF6', '#A855F7'],
  emeraldGreen: ['#10B981', '#34D399'],
  indigoBlue: ['#6366F1', '#8B5CF6'],
  warmAmber: ['#F59E0B', '#FBBF24'],
  vibrantRed: ['#EF4444', '#F87171'],
  coolCyan: ['#06B6D4', '#22D3EE'],
  // Legacy gradients for backward compatibility
  lightPurple: ['#A855F7', '#C084FC'],
  softPurple: ['#F3E8FF', '#E9D5FF'],
  purpleToWhite: ['#8B5CF6', '#FFFFFF'],
  purpleBlue: ['#8B5CF6', '#7C3AED'],
  sunset: ['#F59E0B', '#FBBF24'], // Warm amber gradient
  ocean: ['#06B6D4', '#6366F1'], // Cyan to indigo
};
