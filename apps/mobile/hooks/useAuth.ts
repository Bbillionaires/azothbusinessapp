// =============================================================================
// useAuth — convenience hook wrapping the Zustand auth store
// =============================================================================

import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const clearError = useAuthStore((s) => s.clearError);

  return {
    user,
    profile,
    session,
    isLoading,
    isInitialized,
    isAuthenticated: !!session,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
  };
}
