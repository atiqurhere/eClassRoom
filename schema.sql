-- ============================================================
-- Latifia Quraner Alo — E-Classroom LMS
-- Complete Database Schema (v2 — Class-Centric Architecture)
-- ============================================================
-- ARCHITECTURE:
--   Courses (top-level, admin creates)
--     └─ Classes (sub-units of a course, each has a teacher)
--          └─ Live Classes, Materials, Assignments, Attendance
--   Students enrolled in a Course → get access to all its Classes
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- NOTE: get_my_role() is defined AFTER users table below (ordering fix)

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
CREATE POLICY "Admins can view all users"    ON public.users FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::uuid = id);
CREATE POLICY "Admins can update all users"  ON public.users FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "Trigger can insert users"     ON public.users FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────
-- SECURITY HELPER (defined after users table so relation exists)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS
$$ SELECT role FROM public.users WHERE id = auth.uid()::uuid; $$;

-- ──────────────────────────────────────────────────────────────
-- 2. COURSES (top-level container — admin creates)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view courses" ON public.courses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage courses"       ON public.courses FOR ALL USING (public.get_my_role() = 'admin');
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 3. CLASSES (sub-unit of a course; each has a teacher)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  class_name    text NOT NULL,
  section       text,
  academic_year text,
  teacher_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- teacher assigned per class
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view classes" ON public.classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage classes"       ON public.classes FOR ALL USING (public.get_my_role() = 'admin');
CREATE TRIGGER classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_classes_course_id  ON public.classes(course_id);
CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);

-- ──────────────────────────────────────────────────────────────
-- 4. COURSE ENROLLMENTS (student enrolled in course → all its classes)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.course_enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  enrolled_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  enrolled_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (course_id, student_id)
);
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own enrollments"      ON public.course_enrollments FOR SELECT USING (student_id = auth.uid()::uuid);
CREATE POLICY "Admins manage all enrollments"      ON public.course_enrollments FOR ALL   USING (public.get_my_role() = 'admin');
CREATE POLICY "Teachers view course enrollments"   ON public.course_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.classes WHERE course_id = course_enrollments.course_id AND teacher_id = auth.uid()::uuid)
);
CREATE INDEX idx_enrollments_course_id  ON public.course_enrollments(course_id);
CREATE INDEX idx_enrollments_student_id ON public.course_enrollments(student_id);

-- ──────────────────────────────────────────────────────────────
-- 5. STUDENT INVITES (admin pre-registers students)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.student_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text UNIQUE NOT NULL,
  full_name    text NOT NULL,
  course_ids   uuid[] DEFAULT '{}',           -- courses to auto-enroll on signup
  shift        text CHECK (shift IN ('morning','afternoon','evening', NULL)),
  user_id      uuid UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
  claimed_at   timestamptz,
  created_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.student_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage student invites" ON public.student_invites FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Students can view own invite"      ON public.student_invites FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE INDEX idx_student_invites_code    ON public.student_invites(student_code);
CREATE INDEX idx_student_invites_user_id ON public.student_invites(user_id);

-- ──────────────────────────────────────────────────────────────
-- 6. TEACHER INVITES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.teacher_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_code text UNIQUE NOT NULL,
  full_name    text NOT NULL,
  user_id      uuid UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
  claimed_at   timestamptz,
  created_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.teacher_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage teacher invites" ON public.teacher_invites FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Teachers can view own invite"      ON public.teacher_invites FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE INDEX idx_teacher_invites_code    ON public.teacher_invites(teacher_code);
CREATE INDEX idx_teacher_invites_user_id ON public.teacher_invites(user_id);

-- ──────────────────────────────────────────────────────────────
-- 7. LIVE CLASSES (keyed to class_id — teacher starts from their class)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.live_classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id    uuid NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  room_id       text UNIQUE NOT NULL,
  title         text NOT NULL,
  scheduled_at  timestamptz,
  start_time    timestamptz,
  end_time      timestamptz,
  status        text DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended')),
  recording_url text,
  created_at    timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
-- Students enrolled in the course that owns the class can view
CREATE POLICY "Students can view live classes for enrolled courses" ON public.live_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes cl
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.id = class_id AND ce.student_id = auth.uid()::uuid
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher','admin'))
  );
CREATE POLICY "Teachers can manage their live classes" ON public.live_classes FOR ALL USING (teacher_id = auth.uid()::uuid);
CREATE POLICY "Admins can manage all live classes"     ON public.live_classes FOR ALL USING (public.get_my_role() = 'admin');
CREATE INDEX idx_live_classes_class_id   ON public.live_classes(class_id);
CREATE INDEX idx_live_classes_teacher_id ON public.live_classes(teacher_id);

-- ──────────────────────────────────────────────────────────────
-- 8. MATERIALS (class level)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.materials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  title       text NOT NULL,
  file_url    text NOT NULL,
  file_type   text DEFAULT 'file',
  created_at  timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled students view class materials" ON public.materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes cl
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.id = class_id AND ce.student_id = auth.uid()::uuid
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher','admin'))
  );
CREATE POLICY "Teachers manage own materials" ON public.materials FOR ALL USING (teacher_id = auth.uid()::uuid);
CREATE POLICY "Admins manage all materials"   ON public.materials FOR ALL USING (public.get_my_role() = 'admin');
CREATE INDEX idx_materials_class_id   ON public.materials(class_id);
CREATE INDEX idx_materials_teacher_id ON public.materials(teacher_id);

-- ──────────────────────────────────────────────────────────────
-- 9. ASSIGNMENTS (class level)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  file_url    text,
  due_date    timestamptz NOT NULL,
  max_score   numeric DEFAULT 100,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled students view class assignments" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes cl
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.id = class_id AND ce.student_id = auth.uid()::uuid
    )
  );
CREATE POLICY "Teachers manage their assignments" ON public.assignments FOR ALL USING (teacher_id = auth.uid()::uuid);
CREATE POLICY "Admins manage all assignments"     ON public.assignments FOR ALL USING (public.get_my_role() = 'admin');
CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_assignments_class_id   ON public.assignments(class_id);
CREATE INDEX idx_assignments_teacher_id ON public.assignments(teacher_id);

-- ──────────────────────────────────────────────────────────────
-- 10. SUBMISSIONS
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
CREATE POLICY "Students manage own submissions"        ON public.submissions FOR ALL    USING (student_id = auth.uid()::uuid);
CREATE POLICY "Teachers view and grade submissions"    ON public.submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_id AND teacher_id = auth.uid()::uuid));
CREATE POLICY "Teachers update (grade) submissions"    ON public.submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_id AND teacher_id = auth.uid()::uuid));
CREATE POLICY "Admins manage all submissions"          ON public.submissions FOR ALL    USING (public.get_my_role() = 'admin');
CREATE INDEX idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_student_id    ON public.submissions(student_id);

-- ──────────────────────────────────────────────────────────────
-- 11. ATTENDANCE (via live class → class level)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.attendance (
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
CREATE POLICY "Students view own attendance"   ON public.attendance FOR SELECT USING (student_id = auth.uid()::uuid);
CREATE POLICY "Teachers manage attendance"     ON public.attendance FOR ALL USING (EXISTS (SELECT 1 FROM public.live_classes WHERE id = live_class_id AND teacher_id = auth.uid()::uuid));
CREATE POLICY "System can record attendance"   ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all attendance"     ON public.attendance FOR SELECT USING (public.get_my_role() = 'admin');
CREATE INDEX idx_attendance_student_id    ON public.attendance(student_id);
CREATE INDEX idx_attendance_live_class_id ON public.attendance(live_class_id);

-- ──────────────────────────────────────────────────────────────
-- 12. SCHEDULES (timetable per class)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.schedules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day        text NOT NULL CHECK (day IN ('Sun','Mon','Tue','Wed','Thu','Fri','Sat')),
  start_time time NOT NULL,
  end_time   time NOT NULL,
  room       text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view schedules" ON public.schedules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage schedules"      ON public.schedules FOR ALL USING (public.get_my_role() = 'admin');
CREATE INDEX idx_schedules_class_id ON public.schedules(class_id);

-- ──────────────────────────────────────────────────────────────
-- 13. MESSAGES + PII FLAGGING
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  is_read     boolean DEFAULT false NOT NULL,
  is_flagged  boolean DEFAULT false NOT NULL,  -- PII detected
  flag_reason text,                            -- what was detected
  created_at  timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own messages"       ON public.messages FOR SELECT USING (auth.uid()::uuid = sender_id OR auth.uid()::uuid = receiver_id);
CREATE POLICY "Users send messages"           ON public.messages FOR INSERT WITH CHECK (auth.uid()::uuid = sender_id);
CREATE POLICY "Users delete own messages"     ON public.messages FOR DELETE USING (auth.uid()::uuid = sender_id);
CREATE POLICY "Admins view all messages"      ON public.messages FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "Service role can flag messages" ON public.messages FOR UPDATE USING (true); -- for PII API
CREATE INDEX idx_messages_sender_id   ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at  ON public.messages(created_at DESC);
CREATE INDEX idx_messages_flagged     ON public.messages(is_flagged) WHERE is_flagged = true;

-- ──────────────────────────────────────────────────────────────
-- 14. NOTIFICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL,
  type        text DEFAULT 'info' CHECK (type IN ('info','announcement','assignment','class_start','grade','system','chat_flag')),
  sender_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_role text CHECK (target_role IN ('admin','teacher','student','all')),
  class_id    uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  is_read     boolean DEFAULT false NOT NULL,
  link        text,
  created_at  timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()::uuid
    OR target_role = 'all'
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = target_role)
  );
CREATE POLICY "Users mark own notifications read"        ON public.notifications FOR UPDATE USING (user_id = auth.uid()::uuid);
CREATE POLICY "Teachers and admins create notifications" ON public.notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('admin','teacher')));
CREATE POLICY "System can create notifications"          ON public.notifications FOR INSERT WITH CHECK (true);
CREATE INDEX idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- VALIDATE INVITE FUNCTIONS
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_student_code(p_code text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT CASE
    WHEN si.id IS NULL      THEN jsonb_build_object('valid', false, 'message', 'Invalid Student ID.')
    WHEN si.user_id IS NOT NULL THEN jsonb_build_object('valid', false, 'message', 'This Student ID has already been used.')
    ELSE jsonb_build_object('valid', true, 'name', si.full_name, 'course_ids', si.course_ids, 'shift', si.shift)
  END
  FROM (SELECT * FROM public.student_invites WHERE student_code = p_code) si
  RIGHT JOIN (SELECT 1) dummy ON true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.validate_teacher_code(p_code text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT CASE
    WHEN ti.id IS NULL          THEN jsonb_build_object('valid', false, 'message', 'Invalid Teacher ID.')
    WHEN ti.user_id IS NOT NULL THEN jsonb_build_object('valid', false, 'message', 'This Teacher ID has already been used.')
    ELSE jsonb_build_object('valid', true, 'name', ti.full_name)
  END
  FROM (SELECT * FROM public.teacher_invites WHERE teacher_code = p_code) ti
  RIGHT JOIN (SELECT 1) dummy ON true LIMIT 1;
$$;

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: Auto-create user profile + auto-enroll on signup
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role      text;
  v_course_ids uuid[];
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    v_role
  ) ON CONFLICT (id) DO NOTHING;

  -- If student, auto-enroll in courses from invite
  IF v_role = 'student' THEN
    SELECT course_ids INTO v_course_ids
    FROM public.student_invites
    WHERE user_id = NEW.id;

    IF v_course_ids IS NOT NULL AND array_length(v_course_ids, 1) > 0 THEN
      INSERT INTO public.course_enrollments (course_id, student_id, enrolled_by)
      SELECT unnest(v_course_ids), NEW.id, NULL
      ON CONFLICT (course_id, student_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ──────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars',     'avatars',     true)  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('materials',   'materials',   false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars public read"         ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar"     ON storage.objects FOR UPDATE USING  (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Students upload submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users view submissions" ON storage.objects FOR SELECT USING (bucket_id = 'submissions' AND (auth.uid()::text = (storage.foldername(name))[2] OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher','admin'))));
CREATE POLICY "Teachers upload materials"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role IN ('teacher','admin')));
CREATE POLICY "Auth users view materials"   ON storage.objects FOR SELECT USING (bucket_id = 'materials' AND auth.uid() IS NOT NULL);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Enable Realtime (run in SQL Editor after setup):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Done ✅  Schema ready for Latifia Quraner Alo E-Classroom v2
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━