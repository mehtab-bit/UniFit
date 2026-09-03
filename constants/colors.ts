export const Colors = {
  // Brand UniFit Blues & Navies
  primary: '#2166BF',
  brandPrimary: '#2166BF',
  brandDeep: '#07328D',
  brandNavy: '#001554',
  brandDark: '#02185D',
  brandCyan: '#00C8FF',
  secondaryBlue: '#2166BF',
  primaryDark: '#07328D',
  primaryLight: '#3B82F6',
  primaryMuted: '#EFF6FF',
  primaryHover: '#07328D',

  // Dark & Splash background
  dark: '#001554',
  splashBackground: '#001554',
  navyDeep: '#001554',
  navySplash: '#001554',
  navySurface: '#02185D',
  navyBorder: '#07328D',

  // Backgrounds & Surfaces
  background: '#FFFFFF',
  surfaceWhite: '#FDFDFD',
  surface: '#F6F7F9',
  surfaceCard: '#FFFFFF',
  surfaceSecondary: '#F6F7F9',
  inputBackground: '#F6F7F9',

  // Borders
  border: '#E5E7EB',
  surfaceBorder: '#E5E7EB',
  surfaceBorderFocus: '#2166BF',
  surfaceBorderHover: '#CBD5E1',

  // Typography
  text: '#040E34',
  mainText: '#040E34',
  textNavy: '#040E34',
  textSecondary: '#4B5563',
  textMuted: '#9E9FA9',
  textLight: '#CBD5E1',
  textInverse: '#FFFFFF',
  textInverseMuted: '#9E9FA9',

  // Semantic Accents (Used sparingly)
  success: '#10B981',
  successBackground: '#ECFDF5',
  successBorder: '#A7F3D0',

  warning: '#F59E0B',
  warningBackground: '#FFFBEB',
  warningBorder: '#FDE68A',

  error: '#EF4444',
  errorBackground: '#FEF2F2',
  errorBorder: '#FECACA',

  shadow: '#001554',
  overlay: 'rgba(0, 21, 84, 0.6)',
} as const;

export type ColorKeys = keyof typeof Colors;
