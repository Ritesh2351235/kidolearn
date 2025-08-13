/**
 * Kids-friendly font system using Poppins and Nunito
 * Poppins: Modern, geometric, great for UI elements
 * Nunito: Rounded, friendly, perfect for kids content
 */

export const Fonts = {
  // Primary UI font (Poppins) - for interface elements, buttons, headers
  ui: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    extrabold: 'Poppins_800ExtraBold',
  },
  
  // Content font (Nunito) - for body text, descriptions, friendly text
  content: {
    regular: 'Nunito_400Regular',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extrabold: 'Nunito_800ExtraBold',
  },
  
  // System font fallback
  system: 'System',
};

// Font size scale for consistent typography
export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 36,
};

// Line height scale
export const LineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
};