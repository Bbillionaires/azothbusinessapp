-- Extend receipt_status enum with values used by admin portal and mobile app.
-- 'flagged' is set by admin staff after manual review (confirmed fraud/issue).
-- 'resubmission_requested' is set by admin to ask user to re-submit with fixes.
ALTER TYPE public.receipt_status ADD VALUE IF NOT EXISTS 'flagged';
ALTER TYPE public.receipt_status ADD VALUE IF NOT EXISTS 'resubmission_requested';
