// =============================================================================
// Badge — small label chip component
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../lib/theme';

type BadgeVariant = 'primary' | 'gold' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  small?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'primary', small = false, style, icon }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], small && styles.small, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[styles.label, styles[`label_${variant}`], small && styles.labelSmall]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xxs + 1,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs + 2,
  },
  icon: {
    marginRight: 3,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primaryPale,
  },
  gold: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  success: {
    backgroundColor: Colors.successBg,
  },
  warning: {
    backgroundColor: Colors.warningBg,
  },
  error: {
    backgroundColor: Colors.errorBg,
  },
  neutral: {
    backgroundColor: Colors.surfaceAlt,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Labels
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  labelSmall: {
    fontSize: FontSize.xxs,
  },
  label_primary: {
    color: Colors.primary,
  },
  label_gold: {
    color: Colors.goldDark,
  },
  label_success: {
    color: Colors.success,
  },
  label_warning: {
    color: Colors.warning,
  },
  label_error: {
    color: Colors.error,
  },
  label_neutral: {
    color: Colors.textSecondary,
  },
  label_outline: {
    color: Colors.textSecondary,
  },
});
