-- =============================================================================
-- Migration 006: Jobs — Local job board with applications and resumes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.job_type AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'volunteer',
  'internship'
);

CREATE TYPE public.salary_type AS ENUM (
  'hourly',
  'annual',
  'fixed'
);

CREATE TYPE public.application_status AS ENUM (
  'applied',
  'reviewing',
  'interviewed',
  'offered',
  'hired',
  'rejected'
);

-- ---------------------------------------------------------------------------
-- job_postings
-- ---------------------------------------------------------------------------
CREATE TABLE public.job_postings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Job details
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  type           public.job_type NOT NULL DEFAULT 'full_time',

  -- Compensation
  salary_min     NUMERIC(10,2),
  salary_max     NUMERIC(10,2),
  salary_type    public.salary_type,
  salary_visible BOOLEAN NOT NULL DEFAULT TRUE,

  -- Location
  location       TEXT,
  city           TEXT,
  state          TEXT,
  is_remote      BOOLEAN NOT NULL DEFAULT FALSE,
  is_hybrid      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Requirements and benefits stored as arrays
  requirements   TEXT[] NOT NULL DEFAULT '{}',
  benefits       TEXT[] NOT NULL DEFAULT '{}',

  -- Application flow
  apply_via_app  BOOLEAN NOT NULL DEFAULT TRUE,
  external_apply_url TEXT,

  -- Status and visibility
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  view_count     INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  application_count INTEGER NOT NULL DEFAULT 0 CHECK (application_count >= 0),

  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT salary_range_valid CHECK (
    salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min
  )
);

-- Indexes
CREATE INDEX idx_jobs_business    ON public.job_postings(business_id);
CREATE INDEX idx_jobs_type        ON public.job_postings(type);
CREATE INDEX idx_jobs_active      ON public.job_postings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_jobs_city_state  ON public.job_postings(city, state);
CREATE INDEX idx_jobs_remote      ON public.job_postings(is_remote) WHERE is_remote = TRUE;
CREATE INDEX idx_jobs_expires     ON public.job_postings(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs: anyone can read active"
  ON public.job_postings FOR SELECT
  USING (
    (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()))
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "jobs: business owner can insert"
  ON public.job_postings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "jobs: business owner can update"
  ON public.job_postings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "jobs: business owner can delete"
  ON public.job_postings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "jobs: admins full access"
  ON public.job_postings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- job_applications
-- ---------------------------------------------------------------------------
CREATE TABLE public.job_applications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id         UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_url     TEXT,
  cover_letter   TEXT,
  status         public.application_status NOT NULL DEFAULT 'applied',
  notes          TEXT,              -- internal employer notes
  interview_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, applicant_id)
);

CREATE INDEX idx_applications_job       ON public.job_applications(job_id);
CREATE INDEX idx_applications_applicant ON public.job_applications(applicant_id);
CREATE INDEX idx_applications_status    ON public.job_applications(status);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications: applicant reads own"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "applications: applicant inserts own"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "applications: applicant withdraws own"
  ON public.job_applications FOR UPDATE
  USING (auth.uid() = applicant_id AND status = 'applied')
  WITH CHECK (auth.uid() = applicant_id);

-- Business owner sees all apps for their jobs
CREATE POLICY "applications: business owner reads"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings jp
      JOIN public.businesses b ON b.id = jp.business_id
      WHERE jp.id = job_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "applications: business owner updates status"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings jp
      JOIN public.businesses b ON b.id = jp.business_id
      WHERE jp.id = job_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "applications: admins full access"
  ON public.job_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: increment application count on job posting
CREATE OR REPLACE FUNCTION public.update_job_application_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_postings SET application_count = application_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_postings SET application_count = GREATEST(0, application_count - 1) WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_job_app_count
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_job_application_count();

-- ---------------------------------------------------------------------------
-- user_resumes
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_resumes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  filename    TEXT NOT NULL,
  file_size   INTEGER CHECK (file_size > 0),        -- bytes
  mime_type   TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user    ON public.user_resumes(user_id);
CREATE INDEX idx_resumes_default ON public.user_resumes(user_id, is_default) WHERE is_default = TRUE;

ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resumes: owner access only"
  ON public.user_resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enforce only one default resume per user
CREATE OR REPLACE FUNCTION public.enforce_single_default_resume()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE public.user_resumes
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER single_default_resume
  BEFORE INSERT OR UPDATE ON public.user_resumes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_default_resume();
