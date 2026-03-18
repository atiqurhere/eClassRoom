// Database table types based on Supabase schema
export type UserRole = 'admin' | 'teacher' | 'student'

export type User = {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Student = {
  id: string
  user_id: string
  student_id: string
  class_id?: string
  enrollment_date: string
  created_at: string
}

export type Class = {
  id: string
  class_name: string
  teacher_id?: string
  section?: string
  academic_year?: string
  created_at: string
  updated_at: string
}

export type Course = {
  id: string
  name: string
  description?: string
  class_id: string
  teacher_id?: string
  created_at: string
}

export type LiveClassStatus = 'scheduled' | 'live' | 'ended'

export type LiveClass = {
  id: string
  course_id: string
  teacher_id: string
  room_id: string
  title: string
  scheduled_at?: string
  start_time?: string
  end_time?: string
  status: LiveClassStatus
  recording_url?: string
  created_at: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late'

export type Attendance = {
  id: string
  live_class_id: string
  student_id: string
  join_time: string
  leave_time?: string
  status: AttendanceStatus
  duration_minutes?: number
  created_at: string
}

export type Assignment = {
  id: string
  course_id: string
  teacher_id: string
  title: string
  description?: string
  file_url?: string
  due_date: string
  max_score: number
  created_at: string
  updated_at: string
}

export type SubmissionStatus = 'submitted' | 'graded' | 'late'

export type Submission = {
  id: string
  assignment_id: string
  student_id: string
  file_url?: string
  content?: string
  submitted_at: string
  grade?: number
  feedback?: string
  graded_at?: string
  graded_by?: string
  status: SubmissionStatus
  created_at: string
}

export type NotificationType =
  | 'announcement'
  | 'assignment'
  | 'class_start'
  | 'grade'
  | 'system'

export type NotificationTargetRole = 'admin' | 'teacher' | 'student' | 'all'

export type Notification = {
  id: string
  title: string
  message: string
  type: NotificationType
  sender_id?: string
  target_role?: NotificationTargetRole
  class_id?: string
  user_id?: string
  is_read: boolean
  link?: string
  created_at: string
}

export type Material = {
  id: string
  course_id: string
  teacher_id: string
  title: string
  description?: string
  file_url: string
  file_type?: string
  created_at: string
}

// Extended types with relations
export type ClassWithTeacher = Class & {
  teacher?: User
}

export type CourseWithDetails = Course & {
  class?: Class
  teacher?: User
}

export type AssignmentWithCourse = Assignment & {
  course?: Course
}

export type SubmissionWithStudent = Submission & {
  student?: Student & { user?: User }
  assignment?: Assignment
}

export type LiveClassWithDetails = LiveClass & {
  course?: Course
  teacher?: User
}
