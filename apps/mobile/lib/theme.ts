// =============================================================================
// Design System — Local First Rewards
// =============================================================================

export const Colors = {
  // Brand
  primary: '#1B4332',       // Deep forest green
  primaryLight: '#2D6A4F',  // Medium green
  primaryMid: '#40916C',    // Bright green
  primaryPale: '#D8F3DC',   // Very light green
  primaryBg: '#F0F7F4',     // Green tint background

  gold: '#D4AF37',          // Brand gold
  goldLight: '#F0D060',     // Light gold
  goldDark: '#B8960A',      // Dark gold
  goldBg: '#FFFBEB',        // Gold background

  // Neutrals
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F5',
  border: '#E9ECEF',
  borderStrong: '#CED4DA',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#4A5568',
  textTertiary: '#718096',
  textDisabled: '#A0AEC0',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#38A169',
  successBg: '#F0FFF4',
  warning: '#D69E2E',
  warningBg: '#FFFFF0',
  error: '#E53E3E',
  errorBg: '#FFF5F5',
  info: '#3182CE',
  infoBg: '#EBF8FF',

  // Tier colors
  bronze: '#CD7F32',
  bronzeBg: '#FDF0E8',
  silver: '#A0AEC0',
  silverBg: '#F5F5F5',
  goldTier: '#FFD700',
  goldTierBg: '#FFFDE7',
  platinum: '#718096',
  platinumBg: '#F0F0F0',
  legend: '#9C27B0',
  legendBg: '#F3E5F5',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xxs: 10,
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  hero: 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

export const TierColors: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  bronze:   { color: Colors.bronze,   bg: Colors.bronzeBg,   label: 'Bronze',   emoji: '🥉' },
  silver:   { color: Colors.silver,   bg: Colors.silverBg,   label: 'Silver',   emoji: '🥈' },
  gold:     { color: Colors.goldTier, bg: Colors.goldTierBg, label: 'Gold',     emoji: '🥇' },
  platinum: { color: Colors.platinum, bg: Colors.platinumBg, label: 'Platinum', emoji: '💿' },
  legend:   { color: Colors.legend,   bg: Colors.legendBg,   label: 'Legend',   emoji: '👑' },
};
