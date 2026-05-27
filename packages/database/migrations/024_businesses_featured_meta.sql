-- Add featured_at and featured_by to businesses (used by admin feature API route)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS featured_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
