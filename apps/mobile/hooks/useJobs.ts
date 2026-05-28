// =============================================================================
// useJobs — job postings fetched from Supabase
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobFilters {
  city?: string;
  business_id?: string;
  job_type?: string;
  is_remote?: boolean;
  limit_n?: number;
  offset_n?: number;
}

export interface JobPosting {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
  type: 'full_time' | 'part_time' | 'contract' | 'volunteer' | 'internship';
  salary_min: number | null;
  salary_max: number | null;
  salary_type: 'hourly' | 'annual' | 'fixed' | null;
  city: string | null;
  state: string | null;
  location: string | null;
  is_remote: boolean;
  is_active: boolean;
  experience_level: 'entry' | 'mid' | 'senior' | 'executive' | null;
  application_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  businesses?: {
    id: string;
    name: string;
    logo_url: string | null;
    category: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  status: 'applied' | 'reviewing' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// useJobs — paginated list of active job postings
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 20;

export function useJobs(filters: JobFilters = {}) {
  const [data, setData]       = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset]   = useState(0);

  const limit = filters.limit_n ?? DEFAULT_LIMIT;

  const fetchJobs = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      try {
        let query = supabase
          .from('job_postings')
          .select('*, businesses(id, name, logo_url, category, city, state)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);

        if (filters.city) {
          query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.business_id) {
          query = query.eq('business_id', filters.business_id);
        }
        if (filters.job_type) {
          query = query.eq('type', filters.job_type);
        }
        if (filters.is_remote !== undefined) {
          query = query.eq('is_remote', filters.is_remote);
        }

        // Exclude expired listings
        query = query.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

        const { data: rows, error: err } = await query;

        if (err) throw err;

        const results = (rows ?? []) as unknown as JobPosting[];

        if (reset) {
          setData(results);
          setOffset(limit);
        } else {
          setData((prev) => [...prev, ...results]);
          setOffset((prev) => prev + limit);
        }
        setHasMore(results.length === limit);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load job postings.');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters), offset]
  );

  // Re-fetch from scratch whenever filters change
  useEffect(() => {
    fetchJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const refetch   = useCallback(() => fetchJobs(true), [fetchJobs]);
  const fetchMore = useCallback(() => {
    if (!loading && hasMore) fetchJobs(false);
  }, [loading, hasMore, fetchJobs]);

  return { data, loading, error, refetch, fetchMore, hasMore };
}

// ---------------------------------------------------------------------------
// useJob — single job posting with full business info
// ---------------------------------------------------------------------------

export function useJob(id: string) {
  const [data, setData]       = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: row, error: err } = await supabase
        .from('job_postings')
        .select('*, businesses(id, name, logo_url, category, city, state)')
        .eq('id', id)
        .single();

      if (err) throw err;
      setData(row as unknown as JobPosting);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load job posting.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return { data, loading, error, refetch: fetchJob };
}

// ---------------------------------------------------------------------------
// useApply — submit a job application
// ---------------------------------------------------------------------------

export function useApply(jobId: string) {
  const user = useAuthStore((s) => s.user);

  const [applied, setApplied]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [application, setApplication] = useState<JobApplication | null>(null);

  // Check whether the current user has already applied
  useEffect(() => {
    if (!user || !jobId) return;

    supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('applicant_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setApplied(true);
          setApplication(data as unknown as JobApplication);
        }
      });
  }, [user, jobId]);

  /**
   * Submit an application for the job.
   *
   * @param coverNote  Optional message to the employer
   * @param resumeUrl  Optional URL to a previously uploaded resume
   */
  const apply = useCallback(
    async (
      coverNote?: string,
      resumeUrl?: string
    ): Promise<{ data: JobApplication | null; error: string | null }> => {
      if (!user) return { data: null, error: 'Not authenticated' };
      if (applied) return { data: application, error: null };

      setLoading(true);
      setError(null);

      try {
        const { data: row, error: err } = await supabase
          .from('job_applications')
          .insert({
            job_id:       jobId,
            applicant_id: user.id,
            cover_letter: coverNote ?? null,
            resume_url:   resumeUrl ?? null,
            status:       'applied',
          })
          .select()
          .single();

        if (err) throw err;

        const result = row as unknown as JobApplication;
        setApplied(true);
        setApplication(result);
        return { data: result, error: null };
      } catch (err: any) {
        const msg = err?.message ?? 'Failed to submit application.';
        setError(msg);
        return { data: null, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [user, jobId, applied, application]
  );

  return { apply, applied, application, loading, error };
}
