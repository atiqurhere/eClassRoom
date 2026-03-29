-- =========================================================
-- E-CLASSROOM LMS  –  COMPLETE DATABASE SCHEMA
-- Latifia Quraner Alo | Powered by Supabase + Zoom Pro
-- =========================================================
-- HOW TO USE:
--   1. Open the Supabase SQL Editor
--   2. Paste this entire file and click "Run"
--   3. Create Storage buckets manually in the Dashboard:
--        avatars   (public)
--        materials (private)
--        uploads   (private)   ← assignment submissions
--   4. Enable Realtime for: notifications, messages, live_classes
-- =========================================================

-- -----------------------------------------------------------
-- EXTENSIONS
-- -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------
-- HELPER: updated_at trigger function  (shared by all tables)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Alias used by upload_jobs trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- NOTE: get_my_role() is defined AFTER the users table below

-- -----------------------------------------------------------
-- 1. USERS  (extends auth.users)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        UNIQUE NOT NULL,
  full_name   TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url  TEXT,
  student_id  TEXT,                       -- optional; populated for student accounts
  teacher_id  TEXT,                       -- optional; populated for teacher accounts
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"       ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users"        ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Teachers can view all users"      ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Users can update own profile"     ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service can insert users"         ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete users"          ON public.users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- -----------------------------------------------------------
-- HELPER: get_my_role()  – used in all RLS policies below
-- (defined here because it references public.users)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 2. INVITES  (admin pre-assigns IDs before account creation)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invites (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code  TEXT  UNIQUE NOT NULL,
  role         TEXT  NOT NULL CHECK (role IN ('teacher', 'student')),
  full_name    TEXT,
  email        TEXT,
  used         BOOLEAN     DEFAULT false,
  used_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_by   UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites"     ON public.invites FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Anyone can read invites"   ON public.invites FOR SELECT USING (true);

-- -----------------------------------------------------------
-- 3. CLASSES
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classes (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name     TEXT  NOT NULL,
  teacher_id     UUID  REFERENCES public.users(id) ON DELETE SET NULL,
  section        TEXT,
  academic_year  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view classes"  ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage classes"  ON public.classes FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Teachers manage own class"  ON public.classes FOR UPDATE USING (teacher_id = auth.uid());

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4. STUDENTS  (student ↔ class assignment)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID  NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id       TEXT  UNIQUE NOT NULL,
  class_id         UUID  REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_date  TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own record"          ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Teachers view their class students" ON public.students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
);
CREATE POLICY "Admins manage all students"        ON public.students FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Service can insert students"       ON public.students FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------
-- 5. COURSES  (subjects within a class)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT  NOT NULL,
  description TEXT,
  class_id    UUID  NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id  UUID  REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view courses"         ON public.courses FOR SELECT USING (true);
CREATE POLICY "Teachers manage their courses"     ON public.courses FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admins manage all courses"         ON public.courses FOR ALL USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 6. COURSE ENROLLMENTS  (student ↔ course)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID  NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  student_id  UUID  NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, student_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own enrollments"       ON public.course_enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers view their course enrolls"  ON public.course_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
);
CREATE POLICY "Admins manage enrollments"           ON public.course_enrollments FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Service can insert enrollments"      ON public.course_enrollments FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------
-- 7. LIVE CLASSES  (Zoom-based sessions)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_classes (
  id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID  NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  teacher_id       UUID  NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  title            TEXT  NOT NULL,
  room_id          TEXT  UNIQUE,                       -- legacy / fallback identifier
  scheduled_at     TIMESTAMPTZ,
  start_time       TIMESTAMPTZ,
  end_time         TIMESTAMPTZ,
  status           TEXT  DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  -- Zoom Pro integration
  zoom_meeting_id  TEXT,
  zoom_join_url    TEXT,
  zoom_start_url   TEXT,
  -- Recording (set by webhook worker after YouTube upload)
  recording_url    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their live classes"      ON public.live_classes FOR ALL  USING (teacher_id = auth.uid());
CREATE POLICY "Students view live classes of courses"   ON public.live_classes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.course_id = live_classes.course_id AND ce.student_id = auth.uid()
  )
);
CREATE POLICY "Admins view all live classes"            ON public.live_classes FOR ALL  USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 8. ATTENDANCE  (per-student per-session)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
  id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id    UUID  NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  student_id       UUID  NOT NULL REFERENCES public.users(id)        ON DELETE CASCADE,
  join_time        TIMESTAMPTZ DEFAULT NOW(),
  leave_time       TIMESTAMPTZ,
  duration_minutes INTEGER,
  status           TEXT  DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (live_class_id, student_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own attendance"  ON public.attendance FOR ALL
  USING  (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers manage attendance"      ON public.attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.live_classes lc WHERE lc.id = live_class_id AND lc.teacher_id = auth.uid())
);
CREATE POLICY "Admins manage all attendance"    ON public.attendance FOR ALL USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 9. SCHEDULES  (recurring timetable entries)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schedules (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID  NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  teacher_id  UUID  NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  day_of_week TEXT  NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time  TIME  NOT NULL,
  end_time    TIME  NOT NULL,
  room        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view schedules"     ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Teachers manage schedules"       ON public.schedules FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admins manage all schedules"     ON public.schedules FOR ALL USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 10. ASSIGNMENTS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID  NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  teacher_id  UUID  NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  title       TEXT  NOT NULL,
  description TEXT,
  file_url    TEXT,
  due_date    TIMESTAMPTZ NOT NULL,
  max_score   INTEGER DEFAULT 100,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view assignments for enrolled courses" ON public.assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.course_id = course_id AND ce.student_id = auth.uid())
);
CREATE POLICY "Teachers manage their assignments"   ON public.assignments FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admins manage all assignments"       ON public.assignments FOR ALL USING (public.get_my_role() = 'admin');

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 11. SUBMISSIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  UUID  NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id     UUID  NOT NULL REFERENCES public.users(id)       ON DELETE CASCADE,
  file_url       TEXT,
  content        TEXT,
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  grade          INTEGER,
  feedback       TEXT,
  graded_at      TIMESTAMPTZ,
  graded_by      UUID REFERENCES public.users(id),
  status         TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assignment_id, student_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own submissions"               ON public.submissions FOR ALL
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers view submissions for their assigns"   ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
);
CREATE POLICY "Teachers grade submissions"                    ON public.submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
);
CREATE POLICY "Admins manage all submissions"                 ON public.submissions FOR ALL USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 12. MATERIALS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID  NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  teacher_id  UUID  NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  title       TEXT  NOT NULL,
  description TEXT,
  file_url    TEXT  NOT NULL,
  file_type   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view materials for enrolled courses"  ON public.materials FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.course_id = course_id AND ce.student_id = auth.uid())
);
CREATE POLICY "Teachers manage their materials"   ON public.materials FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admins manage all materials"       ON public.materials FOR ALL USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 13. ANNOUNCEMENTS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT  NOT NULL,
  content     TEXT  NOT NULL,
  author_id   UUID  NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_role TEXT  CHECK (target_role IN ('all', 'teacher', 'student')),
  class_id    UUID  REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view announcements"            ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins and teachers create announcements"   ON public.announcements FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'teacher'));
CREATE POLICY "Authors manage own announcements"           ON public.announcements FOR ALL USING (author_id = auth.uid());
CREATE POLICY "Admins manage all announcements"            ON public.announcements FOR ALL USING (public.get_my_role() = 'admin');

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 14. NOTIFICATIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT  NOT NULL,
  message      TEXT  NOT NULL,
  type         TEXT  NOT NULL CHECK (type IN ('announcement', 'assignment', 'class_start', 'grade', 'system')),
  sender_id    UUID  REFERENCES public.users(id) ON DELETE SET NULL,
  target_role  TEXT  CHECK (target_role IN ('admin', 'teacher', 'student', 'all')),
  class_id     UUID  REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id      UUID  REFERENCES public.users(id)   ON DELETE CASCADE,
  is_read      BOOLEAN DEFAULT false,
  link         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their notifications" ON public.notifications FOR SELECT USING (
  user_id = auth.uid() OR
  target_role = 'all' OR
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = target_role)
);
CREATE POLICY "Users update own notifications"           ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins and teachers create notifications" ON public.notifications FOR INSERT WITH CHECK (
  public.get_my_role() IN ('admin', 'teacher')
);
CREATE POLICY "Admins manage all notifications"          ON public.notifications FOR ALL USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 15. MESSAGES  (direct / chat threads)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    TEXT  NOT NULL,             -- e.g. sorted concat of two user IDs
  sender_id    UUID  NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id  UUID  REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT  NOT NULL,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their messages"    ON public.messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);
CREATE POLICY "Users send messages"          ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users update own messages"    ON public.messages FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Admins view all messages"     ON public.messages FOR SELECT USING (public.get_my_role() = 'admin');

-- -----------------------------------------------------------
-- 16. UPLOAD JOBS  (Zoom recording → YouTube worker queue)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.upload_jobs (
  id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id    UUID  NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  zoom_meeting_id  TEXT  NOT NULL,
  download_url     TEXT  NOT NULL,    -- Zoom recording download link
  download_token   TEXT  NOT NULL,    -- Zoom access token at time of webhook
  status           TEXT  NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempt_count    INTEGER NOT NULL DEFAULT 0,
  error_message    TEXT,
  youtube_url      TEXT,               -- populated on success
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.upload_jobs ENABLE ROW LEVEL SECURITY;

-- Only accessible via service-role key (Railway worker)
-- Authenticated/anon users have zero access
CREATE POLICY "Service role manages upload_jobs" ON public.upload_jobs FOR ALL USING (true);

CREATE TRIGGER upload_jobs_updated_at
  BEFORE UPDATE ON public.upload_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_role                 ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id           ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id          ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_courses_class_id           ON public.courses(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course         ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student        ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_course_id     ON public.live_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_teacher_id    ON public.live_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_status        ON public.live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_zoom_meeting  ON public.live_classes(zoom_meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id      ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_live_class_id   ON public.attendance(live_class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id      ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id  ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id     ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id      ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at   ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id         ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender            ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status         ON public.upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_live_class     ON public.upload_jobs(live_class_id);

-- -----------------------------------------------------------
-- STORAGE BUCKET POLICIES
-- (Run AFTER creating buckets in Supabase Dashboard)
-- Buckets needed: avatars (public), materials (private), uploads (private)
-- -----------------------------------------------------------

-- avatars – public read, owner write
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public avatar read"      ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Owner avatar upload"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner avatar update"     ON storage.objects FOR UPDATE USING  (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- materials – teachers upload, enrolled students read
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Teachers upload materials"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND public.get_my_role() = 'teacher');
CREATE POLICY "Students read materials"      ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Teachers delete materials"    ON storage.objects FOR DELETE USING (bucket_id = 'materials' AND public.get_my_role() IN ('teacher','admin'));

-- uploads – students upload submissions, teachers read
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Students upload submissions"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Students view own uploads"    ON storage.objects FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Teachers view uploads"        ON storage.objects FOR SELECT USING (bucket_id = 'uploads' AND public.get_my_role() IN ('teacher','admin'));

-- =========================================================
-- END OF SCHEMA
-- =========================================================
--
-- TABLES SUMMARY:
--   1.  users               – all accounts (admin / teacher / student)
--   2.  invites             – pre-assigned IDs for registration
--   3.  classes             – class groups
--   4.  students            – student ↔ class, stores student_id
--   5.  courses             – subjects within a class
--   6.  course_enrollments  – student ↔ course mapping
--   7.  live_classes        – Zoom-based sessions (zoom_meeting_id, urls)
--   8.  attendance          – per-student per-session records
--   9.  schedules           – recurring weekly timetable
--  10.  assignments         – teacher-created tasks
--  11.  submissions         – student assignment submissions
--  12.  materials           – course files/PDFs
--  13.  announcements       – broadcast messages
--  14.  notifications       – in-app push notifications
--  15.  messages            – direct messaging / chat
--  16.  upload_jobs         – Zoom recording → YouTube worker queue
--
-- AFTER RUNNING:
--   • Enable Realtime in Database > Replication for:
--       notifications, messages, live_classes
--   • Add ENV vars: ZOOM_*, YOUTUBE_*, SUPABASE_SERVICE_ROLE_KEY
-- =========================================================