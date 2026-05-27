-- Add experience_level to job_postings (used by mobile app filter and display)
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS experience_level TEXT
    CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive'));

CREATE INDEX IF NOT EXISTS idx_jobs_experience ON public.job_postings(experience_level)
  WHERE experience_level IS NOT NULL;
