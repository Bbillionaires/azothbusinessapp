// =============================================================================
// Jobs Types
// =============================================================================

export type JobType = 'full_time' | 'part_time' | 'contract' | 'volunteer' | 'internship';

export type SalaryType = 'hourly' | 'annual' | 'fixed';

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'interviewed'
  | 'offered'
  | 'hired'
  | 'rejected';

// ---------------------------------------------------------------------------
// Job Posting — mirrors public.job_postings
// ---------------------------------------------------------------------------
export interface JobPosting {
  id: string;
  business_id: string;

  title: string;
  description: string;
  type: JobType;

  // Compensation
  salary_min: number | null;
  salary_max: number | null;
  salary_type: SalaryType | null;
  salary_visible: boolean;

  // Location
  location: string | null;
  city: string | null;
  state: string | null;
  is_remote: boolean;
  is_hybrid: boolean;

  requirements: string[];
  benefits: string[];

  apply_via_app: boolean;
  external_apply_url: string | null;

  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  application_count: number;

  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type JobPostingInsert = Omit<
  JobPosting,
  'id' | 'view_count' | 'application_count' | 'created_at' | 'updated_at'
> & {
  id?: string;
  view_count?: number;
  application_count?: number;
};

export type JobPostingUpdate = Partial<
  Omit<JobPosting, 'id' | 'business_id' | 'view_count' | 'application_count' | 'created_at' | 'updated_at'>
>;

// ---------------------------------------------------------------------------
// Job Application — mirrors public.job_applications
// ---------------------------------------------------------------------------
export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  notes: string | null;
  interview_at: string | null;
  created_at: string;
  updated_at: string;
}

export type JobApplicationInsert = Pick<
  JobApplication,
  'job_id' | 'applicant_id' | 'resume_url' | 'cover_letter'
>;

// ---------------------------------------------------------------------------
// User Resume — mirrors public.user_resumes
// ---------------------------------------------------------------------------
export interface UserResume {
  id: string;
  user_id: string;
  url: string;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  is_default: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Composite types for UI
// ---------------------------------------------------------------------------
export interface JobPostingWithBusiness extends JobPosting {
  business: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    city: string | null;
    state: string | null;
    verification_level: string;
  };
  user_application?: JobApplication | null;
}

export interface JobCard
  extends Pick<
    JobPosting,
    | 'id'
    | 'title'
    | 'type'
    | 'salary_min'
    | 'salary_max'
    | 'salary_type'
    | 'salary_visible'
    | 'city'
    | 'state'
    | 'is_remote'
    | 'is_hybrid'
    | 'is_active'
    | 'created_at'
  > {
  business_name: string;
  business_logo?: string | null;
}

export interface ApplicationWithJob extends JobApplication {
  job: Pick<JobPosting, 'id' | 'title' | 'type' | 'city' | 'state' | 'is_remote'>;
  business: {
    name: string;
    logo_url: string | null;
  };
}

// ---------------------------------------------------------------------------
// Job type display config
// ---------------------------------------------------------------------------
export interface JobTypeConfig {
  type: JobType;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
}
