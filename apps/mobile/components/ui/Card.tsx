// =============================================================================
// Card — surface container component
// =============================================================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing | number;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  borderRadius?: keyof typeof Radius;
}

export function Card({
  children,
  style,
  padding = 'lg',
  shadow = 'md',
  borderRadius = 'lg',
}: CardProps) {
  const paddingValue = typeof padding === 'number' ? padding : Spacing[padding];
  const radiusValue = Radius[borderRadius];
  const shadowStyle = shadow === 'none' ? {} : Shadows[shadow];

  return (
    <View
      style={[
        styles.base,
        { padding: paddingValue, borderRadius: radiusValue },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
  },
});
