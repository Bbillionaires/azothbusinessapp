// =============================================================================
// Auth Store — Zustand
// =============================================================================

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, ProfileUpdate } from '../../../packages/shared/src/types/user';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, referralCode?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<{ error: string | null }>;
  loadProfile: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user, session });
        await get().loadProfile(session.user.id);
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          set({ user: session.user, session });
          await get().loadProfile(session.user.id);
        } else {
          set({ user: null, profile: null, session: null });
        }
      });
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message });
        return { error: error.message };
      }
      if (data.session?.user) {
        set({ user: data.session.user, session: data.session });
        await get().loadProfile(data.session.user.id);
      }
      return { error: null };
    } catch (err) {
      const msg = 'An unexpected error occurred. Please try again.';
      set({ error: msg });
      return { error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName, referralCode) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            referral_code_used: referralCode,
          },
        },
      });
      if (error) {
        set({ error: error.message });
        return { error: error.message };
      }
      if (data.session?.user) {
        set({ user: data.session.user, session: data.session });
        await get().loadProfile(data.session.user.id);
      }
      return { error: null };
    } catch (err) {
      const msg = 'Failed to create account. Please try again.';
      set({ error: msg });
      return { error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null, isLoading: false });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { error: 'Not authenticated' };

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }
      set({ profile: data as Profile });
      return { error: null };
    } catch (err) {
      return { error: 'Failed to update profile.' };
    } finally {
      set({ isLoading: false });
    }
  },

  loadProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        set({ profile: data as Profile });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
