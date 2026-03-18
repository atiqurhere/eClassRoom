'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { assignmentSchema, type AssignmentInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface AssignmentFormProps {
  courseId?: string
  onSuccess?: () => void
}

export function AssignmentForm({ courseId, onSuccess }: AssignmentFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { courseId: courseId || '', maxScore: 100 },
  })

  const onSubmit = async (data: AssignmentInput) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase.from('assignments').insert({
        title: data.title,
        description: data.description,
        course_id: data.courseId,
        due_date: data.dueDate,
        max_score: data.maxScore,
      })
      if (error) throw error
      toast.success('Assignment created successfully!')
      reset()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent-blue)' }}>
          <BookOpen size={14} />
        </div>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Create New Assignment</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Assignment Title"
          placeholder="Enter assignment title"
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Description
          </label>
          <textarea
            className="form-input w-full"
            rows={3}
            placeholder="Describe the assignment..."
            style={{ resize: 'vertical' }}
            {...register('description')}
          />
          {errors.description && <p className="mt-1 text-xs" style={{ color: 'var(--accent-red)' }}>{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due Date"
            type="datetime-local"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
          <Input
            label="Max Score"
            type="number"
            placeholder="100"
            error={errors.maxScore?.message}
            {...register('maxScore', { valueAsNumber: true })}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="gradient" loading={loading} fullWidth>
            Create Assignment
          </Button>
          <Button type="button" variant="secondary" onClick={() => reset()}>Reset</Button>
        </div>
      </form>
    </div>
  )
}