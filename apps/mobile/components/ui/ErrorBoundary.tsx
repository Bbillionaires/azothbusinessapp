// =============================================================================
// ErrorBoundary — class component catch-all for render errors
// =============================================================================

import React from 'react'
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native'
import { Colors, FontSize, Spacing, Radius } from '../../lib/theme'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </Text>
            <Pressable
              onPress={() => this.setState({ hasError: false, error: null })}
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnText}>Try Again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
    minWidth: 160,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
})
