// =============================================================================
// useAuth — real Supabase auth hook wrapping the Zustand auth store
// =============================================================================

import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export interface UpdateProfileParams {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

export function useAuth() {
  const user         = useAuthStore((s) => s.user);
  const profile      = useAuthStore((s) => s.profile);
  const session      = useAuthStore((s) => s.session);
  const loading      = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error        = useAuthStore((s) => s.error);
  const signIn       = useAuthStore((s) => s.signIn);
  const signUp       = useAuthStore((s) => s.signUp);
  const signOut      = useAuthStore((s) => s.signOut);
  const loadProfile  = useAuthStore((s) => s.loadProfile);
  const clearError   = useAuthStore((s) => s.clearError);

  /**
   * Update display_name, bio, and/or avatar_url on the profiles table,
   * then refresh the local profile state.
   */
  const updateProfile = useCallback(
    async (updates: UpdateProfileParams): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };

      const { error: err } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (err) return { error: err.message };

      // Refresh profile in the store
      await loadProfile(user.id);
      return { error: null };
    },
    [user, loadProfile]
  );

  return {
    user,
    profile,
    session,
    loading,
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
