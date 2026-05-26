// =============================================================================
// LoadingScreen — full-screen centered activity indicator
// =============================================================================

import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { Colors, FontSize, Spacing } from '../../lib/theme'

interface Props {
  message?: string
}

export function LoadingScreen({ message = 'Loading...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  message: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
})
