'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import type { AdminRole } from '@/lib/supabase';
import { Shield, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
  fallback?: React.ReactNode;
}

interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  avatar_url?: string;
}

// Context so children can read the current user/role
import { createContext, useContext } from 'react';

interface AdminAuthContext {
  profile: AdminProfile | null;
  role: AdminRole | null;
}

const AdminAuthCtx = createContext<AdminAuthContext>({ profile: null, role: null });
export const useAdminAuth = () => useContext(AdminAuthCtx);

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        const { data: adminProfile, error } = await supabase
          .from('admin_profiles')
          .select('id, email, full_name, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (error || !adminProfile) {
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        const validRoles: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin'];
        if (!validRoles.includes(adminProfile.role as AdminRole)) {
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        if (allowedRoles && !allowedRoles.includes(adminProfile.role as AdminRole)) {
          setDenied(true);
          setLoading(false);
          return;
        }

        setProfile(adminProfile as AdminProfile);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [router, supabase, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          <p className="text-slate-400 text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (denied) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Access Denied</h2>
          <p className="text-slate-400">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthCtx.Provider value={{ profile, role: profile?.role ?? null }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}
