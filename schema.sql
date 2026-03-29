-- ============================================
-- E-CLASSROOM LMS - COMPLETE SUPABASE SCHEMA
-- ============================================
-- This file contains the complete database schema for the E-Classroom LMS
-- Run this in Supabase SQL Editor to set up the entire database

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 2. CLASSES TABLE
-- ============================================
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  section TEXT,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view classes" ON public.classes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. STUDENTS TABLE
-- ============================================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own data" ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can view their class students" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all students" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 4. COURSES TABLE (Subjects)
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view courses" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their courses" ON public.courses
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. LIVE CLASSES TABLE
-- ============================================
CREATE TABLE public.live_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view classes of their courses" ON public.live_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.students s ON s.class_id = c.class_id
      WHERE c.id = course_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage their live classes" ON public.live_classes
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all live classes" ON public.live_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. ATTENDANCE TABLE
-- ============================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_class_id UUID NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  join_time TIMESTAMPTZ DEFAULT NOW(),
  leave_time TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage attendance for their classes" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.live_classes lc
      WHERE lc.id = live_class_id AND lc.teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can create attendance" ON public.attendance
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 7. ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  max_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view assignments for their courses" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.students s ON s.class_id = c.class_id
      WHERE c.id = course_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage their assignments" ON public.assignments
  FOR ALL USING (teacher_id = auth.uid());

-- ============================================
-- 8. SUBMISSIONS TABLE
-- ============================================
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_url TEXT,
  content TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view and create own submissions" ON public.submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view submissions for their assignments" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update submissions for their assignments" ON public.submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
    )
  );

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'assignment', 'class_start', 'grade', 'system')),
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_role TEXT CHECK (target_role IN ('admin', 'teacher', 'student', 'all')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid() OR
    target_role = 'all' OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = target_role
    ) OR
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid() AND s.class_id = class_id
    )
  );

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins and teachers can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- ============================================
-- 10. MATERIALS TABLE
-- ============================================
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view materials for their courses" ON public.materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.students s ON s.class_id = c.class_id
      WHERE c.id = course_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage their materials" ON public.materials
  FOR ALL USING (teacher_id = auth.uid());

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_courses_class_id ON public.courses(class_id);
CREATE INDEX idx_live_classes_course_id ON public.live_classes(course_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS & POLICIES
-- ============================================
-- NOTE: Storage buckets must be created via Supabase Dashboard first
-- Then run these policies in SQL Editor

-- Storage policies for avatars (public)
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'avatars' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can update their own avatar"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'avatars' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Storage policies for assignments (private)
-- CREATE POLICY "Teachers can upload assignments"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'assignments' AND
--     EXISTS (
--       SELECT 1 FROM public.users
--       WHERE id = auth.uid() AND role = 'teacher'
--     )
--   );

-- CREATE POLICY "Students can view assignments for their courses"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'assignments');

-- Storage policies for submissions (private)
-- CREATE POLICY "Students can upload submissions"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'submissions' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Students can view own submissions"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'submissions' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Teachers can view all submissions"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'submissions' AND
--     EXISTS (
--       SELECT 1 FROM public.users
--       WHERE id = auth.uid() AND role = 'teacher'
--     )
--   );

-- Storage policies for materials (private)
-- CREATE POLICY "Teachers can upload materials"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'materials' AND
--     EXISTS (
--       SELECT 1 FROM public.users
--       WHERE id = auth.uid() AND role = 'teacher'
--     )
--   );

-- CREATE POLICY "Students can view materials for their courses"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'materials');

-- ============================================
-- END OF SCHEMA
-- ============================================

-- NOTES:
-- 1. Create storage buckets manually in Supabase Dashboard:
--    - avatars (public)
--    - assignments (private)
--    - submissions (private)
--    - materials (private)
--
-- 2. After creating buckets, uncomment and run the storage policies above
--
-- 3. Enable Realtime for notifications table in Database > Replication
--
-- 4. Your database is now ready for the E-Classroom LMS!