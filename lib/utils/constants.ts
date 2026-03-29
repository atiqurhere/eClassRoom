// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const

// Live class status
export const LIVE_CLASS_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
} as const

// Attendance status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
} as const

// Submission status
export const SUBMISSION_STATUS = {
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  LATE: 'late',
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'announcement',
  ASSIGNMENT: 'assignment',
  CLASS_START: 'class_start',
  GRADE: 'grade',
  SYSTEM: 'system',
} as const

// File upload limits
export const FILE_LIMITS = {
  AVATAR_MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ASSIGNMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  SUBMISSION_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MATERIAL_MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed'],
} as const

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  MATERIALS: 'materials',
} as const

// Zoom configuration
export const ZOOM_CONFIG = {
  API_BASE: 'https://api.zoom.us/v2',
  TOKEN_URL: 'https://zoom.us/oauth/token',
} as const

// App routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN_DASHBOARD: '/admin/dashboard',
  TEACHER_DASHBOARD: '/teacher/dashboard',
  STUDENT_DASHBOARD: '/student/dashboard',
  PROFILE: '/profile',
} as const
