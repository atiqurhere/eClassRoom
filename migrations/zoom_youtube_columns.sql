-- ============================================================
-- Migration: Zoom + YouTube Integration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add Zoom meeting fields to live_classes
ALTER TABLE public.live_classes
  ADD COLUMN IF NOT EXISTS zoom_meeting_id  text,
  ADD COLUMN IF NOT EXISTS zoom_join_url    text,
  ADD COLUMN IF NOT EXISTS zoom_start_url   text;

-- 2. Upload job queue (polled by worker on Railway)
--    The webhook writes a row here; the worker processes it.
CREATE TABLE IF NOT EXISTS public.upload_jobs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id    uuid        NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  zoom_meeting_id  text        NOT NULL,
  download_url     text        NOT NULL,         -- Zoom recording download URL
  download_token   text        NOT NULL,         -- Zoom access token valid at time of webhook
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','processing','done','failed')),
  attempt_count    integer     NOT NULL DEFAULT 0,
  error_message    text,
  youtube_url      text,                         -- set on success
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.upload_jobs ENABLE ROW LEVEL SECURITY;

-- Only the service-role key (used by the Railway worker) can touch this table.
-- Anon/authenticated users have no access at all.
CREATE POLICY "Service role manages upload_jobs"
  ON public.upload_jobs FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_upload_jobs_status
  ON public.upload_jobs(status);

CREATE INDEX IF NOT EXISTS idx_upload_jobs_live_class
  ON public.upload_jobs(live_class_id);

-- Auto-update updated_at on every row change
CREATE TRIGGER upload_jobs_updated_at
  BEFORE UPDATE ON public.upload_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Done ✅
