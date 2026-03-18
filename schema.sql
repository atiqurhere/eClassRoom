-- ============================================================
-- Latifia Quraner Alo — E-Classroom LMS
-- Complete Database Schema
-- ============================================================
-- Run this once in Supabase SQL Editor to set up the database.
-- Safe to run on a fresh project. Do NOT run on an existing DB
-- that already has data — use migrations instead.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- 1. USERS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url  text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"   ON public.users FOR SELECT USING (auth.uid()::uuid = id);
CREATE POLICY "Admins can view all users"    ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin'));
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::uuid = id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 2. CLASSES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name    text NOT NULL,
  section       text,
  academic_year text,
  teacher_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view classes" ON public.classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage classes"            ON public.classes FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin'));

CREATE TRIGGER classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 3. STUDENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.students (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  student_id      text UNIQUE NOT NULL,
  class_id        uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_date timestamptz DEFAULT now() NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own record"           ON public.students FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Teachers can view their class students" ON public.students FOR SELECT USING (EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid()::uuid));
CREATE POLICY "Admins can manage all students"         ON public.students FOR ALL   USING (EXISTS (SELECT 1 FROM public.users  WHERE id = auth.uid()::uuid AND role = 'admin'));

CREATE INDEX idx_students_user_id  ON public.students(user_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);

-- ──────────────────────────────────────────────────────────────
-- 4. COURSES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  class_id    uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view courses" ON public.courses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teachers can manage own courses"      ON public.courses FOR ALL USING (teacher_id = auth.uid()::uuid);
CREATE POLICY "Admins can manage all courses"        ON public.courses FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin'));

CREATE INDEX idx_courses_class_id   ON public.courses(class_id);
CREATE INDEX idx_courses_teacher_id ON public.courses(teacher_id);

-- ──────────────────────────────────────────────────────────────
-- 5. COURSE MATERIALS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.course_materials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title      text NOT NULL,
  file_url   text,
  type       text DEFAULT 'document',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users and teachers can view materials" ON public.course_materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()::uuid)
    OR EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.courses c ON c.class_id = s.class_id
      WHERE c.id = course_id AND s.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Teachers and admins can manage materials" ON public.course_materials
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher', 'admin')));

CREATE INDEX idx_course_materials_course_id ON public.course_materials(course_id);

-- ──────────────────────────────────────────────────────────────
-- 6. LIVE CLASSES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.live_classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id    uuid NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  room_id       text UNIQUE NOT NULL,
  title         text NOT NULL,
  scheduled_at  timestamptz,
  start_time    timestamptz,
  end_time      timestamptz,
  status        text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  recording_url text,
  created_at    timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view live classes for their courses" ON public.live_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.courses c ON c.class_id = s.class_id
      WHERE c.id = course_id AND s.user_id = auth.uid()::uuid
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers can manage their live classes" ON public.live_classes FOR ALL USING (teacher_id = auth.uid()::uuid);
CREATE POLICY "Admins can manage all live classes"     ON public.live_classes FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin'));

CREATE INDEX idx_live_classes_course_id ON public.live_classes(course_id);

-- ──────────────────────────────────────────────────────────────
-- 7. ATTENDANCE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.attendance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id    uuid NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  student_id       uuid NOT NULL REFERENCES public.students(id)     ON DELETE CASCADE,
  join_time        timestamptz DEFAULT now(),
  leave_time       timestamptz,
  duration_minutes integer,
  status           text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (live_class_id, student_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE id = attendance.student_id AND user_id = auth.uid()::uuid));
CREATE POLICY "Teachers can manage attendance"   ON public.attendance
  FOR ALL USING (EXISTS (SELECT 1 FROM public.live_classes WHERE id = live_class_id AND teacher_id = auth.uid()::uuid));
CREATE POLICY "System can record attendance"     ON public.attendance FOR INSERT WITH CHECK (true);

CREATE INDEX idx_attendance_student_id    ON public.attendance(student_id);
CREATE INDEX idx_attendance_live_class_id ON public.attendance(live_class_id);

-- ──────────────────────────────────────────────────────────────
-- 8. ASSIGNMENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  file_url    text,
  due_date    timestamptz NOT NULL,
  max_score   numeric DEFAULT 100,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view assignments for their courses" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.courses c ON c.class_id = s.class_id
      WHERE c.id = course_id AND s.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Teachers can manage their assignments" ON public.assignments FOR ALL USING (teacher_id = auth.uid()::uuid);
CREATE POLICY "Admins can manage all assignments"     ON public.assignments FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin'));

CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_assignments_course_id ON public.assignments(course_id);

-- ──────────────────────────────────────────────────────────────
-- 9. SUBMISSIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES public.users(id)       ON DELETE CASCADE,
  content       text,
  file_url      text,
  submitted_at  timestamptz DEFAULT now(),
  score         numeric,
  feedback      text,
  graded_at     timestamptz,
  graded_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE (assignment_id, student_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own submissions" ON public.submissions
  FOR ALL USING (student_id = auth.uid()::uuid);

CREATE POLICY "Teachers can view and grade submissions" ON public.submissions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_id AND teacher_id = auth.uid()::uuid));

CREATE POLICY "Teachers can update (grade) submissions" ON public.submissions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_id AND teacher_id = auth.uid()::uuid));

CREATE POLICY "Admins can manage all submissions" ON public.submissions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'admin'));

CREATE INDEX idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_student_id    ON public.submissions(student_id);

-- ──────────────────────────────────────────────────────────────
-- 10. MESSAGES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  is_read     boolean DEFAULT false NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"        ON public.messages FOR SELECT USING (auth.uid()::uuid = sender_id OR auth.uid()::uuid = receiver_id);
CREATE POLICY "Users can send messages"            ON public.messages FOR INSERT WITH CHECK (auth.uid()::uuid = sender_id);
CREATE POLICY "Users can delete own sent messages" ON public.messages FOR DELETE USING (auth.uid()::uuid = sender_id);

CREATE INDEX idx_messages_sender_id   ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at  ON public.messages(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 11. NOTIFICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL,
  type        text DEFAULT 'info' CHECK (type IN ('info', 'announcement', 'assignment', 'class_start', 'grade', 'system')),
  sender_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_role text CHECK (target_role IN ('admin', 'teacher', 'student', 'all')),
  class_id    uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  is_read     boolean DEFAULT false NOT NULL,
  link        text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()::uuid
    OR target_role = 'all'
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = target_role)
    OR EXISTS (SELECT 1 FROM public.students WHERE user_id = auth.uid()::uuid AND class_id = notifications.class_id)
  );

CREATE POLICY "Users can mark own notifications read"          ON public.notifications FOR UPDATE USING (user_id = auth.uid()::uuid);
CREATE POLICY "Admins and teachers can create notifications"   ON public.notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('admin', 'teacher')));
CREATE POLICY "System can create notifications (service role)" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE INDEX idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- STORAGE BUCKETS & POLICIES
-- ──────────────────────────────────────────────────────────────

-- Avatars (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Submissions (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Course materials (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Avatar policies
CREATE POLICY "Avatars are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar"   ON storage.objects FOR UPDATE USING  (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Submission policies
CREATE POLICY "Students can upload submissions" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.uid() IS NOT NULL);

CREATE POLICY "Students can view own submission files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'submissions' AND (
      auth.uid()::text = (storage.foldername(name))[2]
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher', 'admin'))
    )
  );

-- Material policies
CREATE POLICY "Teachers can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'materials'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Authenticated users can view materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'materials' AND auth.uid() IS NOT NULL);

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: Auto-create user profile on signup
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2 (run separately in SQL Editor if needed):
-- Enable Realtime for messages and notifications
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Done ✅  Your database is ready for Latifia Quraner Alo E-Classroom
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━