-- Extend business_status enum to add values used by admin portal.
-- Migration 002 only defined: pending, active, suspended, closed.
-- The admin portal also needs: rejected (application denied) and under_review.

ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'under_review';
