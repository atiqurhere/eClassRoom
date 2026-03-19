-- ============================================================
-- MIGRATION: Fix Attendance RLS + Create Table if Missing
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create attendance table (if not already exists from schema.sql)
CREATE TABLE IF NOT EXISTS public.attendance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id    uuid NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  student_id       uuid NOT NULL REFERENCES public.users(id)        ON DELETE CASCADE,
  join_time        timestamptz DEFAULT now(),
  leave_time       timestamptz,
  duration_minutes integer,
  status           text DEFAULT 'present' CHECK (status IN ('present','absent','late')),
  created_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (live_class_id, student_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Students view own attendance"   ON public.attendance;
DROP POLICY IF EXISTS "System can record attendance"   ON public.attendance;
DROP POLICY IF EXISTS "Teachers manage attendance"     ON public.attendance;
DROP POLICY IF EXISTS "Admins view all attendance"     ON public.attendance;
DROP POLICY IF EXISTS "Students manage own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins manage all attendance"   ON public.attendance;

-- Students can INSERT (join) and UPDATE (leave time) their own attendance records
CREATE POLICY "Students manage own attendance" ON public.attendance
  FOR ALL USING (student_id = auth.uid()::uuid) WITH CHECK (student_id = auth.uid()::uuid);

-- Teachers can manage attendance for their live classes
CREATE POLICY "Teachers manage attendance" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.live_classes
      WHERE id = live_class_id AND teacher_id = auth.uid()::uuid
    )
  );

-- Admins can manage everything
CREATE POLICY "Admins manage all attendance" ON public.attendance
  FOR ALL USING (public.get_my_role() = 'admin');

-- Indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_attendance_student_id    ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_live_class_id ON public.attendance(live_class_id);
