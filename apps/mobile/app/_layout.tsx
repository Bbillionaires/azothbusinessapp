// =============================================================================
// Root Layout — providers + auth guard
// =============================================================================

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../lib/theme';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/');
    }
  }, [session, isInitialized, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthGuard>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="business/[id]"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerTintColor: Colors.textInverse,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="events/[id]"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerTintColor: Colors.textInverse,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="jobs/[id]"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerTintColor: Colors.textInverse,
                animation: 'slide_from_right',
              }}
            />
          </Stack>
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
