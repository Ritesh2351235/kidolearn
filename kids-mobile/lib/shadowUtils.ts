import { Platform } from 'react-native';

/**
 * Creates cross-platform shadow styles
 * For iOS/Android: uses shadowColor, shadowOffset, etc.
 * For Web: uses boxShadow
 */
export const createShadow = ({
  color = '#000',
  offset = { width: 0, height: 2 },
  opacity = 0.1,
  radius = 4,
  elevation = 2,
}: {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
}) => {
  if (Platform.OS === 'web') {
    // Convert to web-compatible boxShadow
    const shadowColor = `rgba(${color === '#000' ? '0, 0, 0' : color.replace('#', '')}, ${opacity})`;
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${shadowColor}`,
    };
  }

  // For iOS and Android
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation, // Android elevation
  };
};

// Common shadow presets
export const shadows = {
  small: createShadow({
    color: '#000',
    offset: { width: 0, height: 1 },
    opacity: 0.05,
    radius: 2,
    elevation: 1,
  }),
  medium: createShadow({
    color: '#000',
    offset: { width: 0, height: 2 },
    opacity: 0.1,
    radius: 4,
    elevation: 3,
  }),
  large: createShadow({
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.15,
    radius: 8,
    elevation: 5,
  }),
  card: createShadow({
    color: '#000',
    offset: { width: 0, height: 2 },
    opacity: 0.05,
    radius: 8,
    elevation: 2,
  }),
  button: createShadow({
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.1,
    radius: 12,
    elevation: 4,
  }),
  primary: createShadow({
    color: '#8B5CF6',
    offset: { width: 0, height: 4 },
    opacity: 0.3,
    radius: 12,
    elevation: 8,
  }),
};
