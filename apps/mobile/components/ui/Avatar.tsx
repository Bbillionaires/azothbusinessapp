// =============================================================================
// Avatar — user/business avatar with fallback initials
// =============================================================================

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, FontWeight, Radius } from '../../lib/theme';

export interface AvatarProps {
  uri?: string | null | undefined;
  name?: string | null | undefined;
  size?: number;
  borderColor?: string | undefined;
  borderWidth?: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? '?';
  return (parts[0]?.charAt(0) ?? '') + (parts[parts.length - 1]?.charAt(0) ?? '');
}

function getColorForName(name: string | null | undefined): string {
  const colors = [
    Colors.primary,
    Colors.primaryLight,
    Colors.primaryMid,
    '#2C5282',
    '#7B341E',
    '#553C9A',
    '#285E61',
    '#744210',
  ];
  if (!name) return Colors.primary;
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] ?? Colors.primary;
}

export function Avatar({ uri, name, size = 40, borderColor, borderWidth = 0 }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorForName(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          borderColor: borderColor ?? 'transparent',
          borderWidth,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize, lineHeight: size }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
});
