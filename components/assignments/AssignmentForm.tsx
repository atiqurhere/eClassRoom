'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { assignmentSchema, type AssignmentInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
    defaultValues: {
      courseId: courseId || '',
      maxScore: 100,
    },
  })

  const onSubmit = async (data: AssignmentInput) => {
    try {
      setLoading(true)
      // In a real app, this would call Supabase
      console.log('Creating assignment:', data)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Assignment created successfully!')
      reset()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Assignment Title"
            placeholder="Enter assignment title"
            error={errors.title?.message}
            {...register('title')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              rows={4}
              placeholder="Enter assignment description..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="datetime-local"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />

            <Input
              label="Maximum Score"
              type="number"
              placeholder="100"
              error={errors.maxScore?.message}
              {...register('maxScore', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment File (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex space-x-3">
            <Button type="submit" loading={loading} className="flex-1">
              Create Assignment
            </Button>
            <Button type="button" variant="secondary" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}