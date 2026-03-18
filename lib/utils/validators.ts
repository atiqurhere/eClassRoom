import { z } from 'zod'

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'teacher', 'student']),
  studentId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Assignment validation schemas
export const assignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  dueDate: z.string(),
  maxScore: z.number().min(1).max(1000),
  courseId: z.string().uuid(),
})

// Class validation schemas
export const classSchema = z.object({
  className: z.string().min(2, 'Class name must be at least 2 characters'),
  section: z.string().optional(),
  academicYear: z.string().optional(),
  teacherId: z.string().uuid().optional(),
})

// Course validation schemas
export const courseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  description: z.string().optional(),
  classId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
})

// User validation schemas
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'teacher', 'student']),
  studentId: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type AssignmentInput = z.infer<typeof assignmentSchema>
export type ClassInput = z.infer<typeof classSchema>
export type CourseInput = z.infer<typeof courseSchema>
export type UserInput = z.infer<typeof userSchema>
