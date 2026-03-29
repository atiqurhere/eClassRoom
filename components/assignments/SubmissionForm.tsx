'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FileText, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface SubmissionFormProps {
  assignmentId: string
  assignmentTitle: string
  dueDate: string
  maxScore: number
  onSuccess?: () => void
}

export function SubmissionForm({ assignmentId, assignmentTitle, dueDate, maxScore, onSuccess }: SubmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [content, setContent] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile && !content.trim()) {
      toast.error('Please upload a file or enter text submission')
      return
    }

    try {
      setLoading(true)

      // In a real app, this would upload to Supabase Storage
      console.log('Submitting assignment:', {
        assignmentId,
        file: selectedFile,
        content,
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success('Assignment submitted successfully!')
      setSelectedFile(null)
      setContent('')
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit assignment')
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = new Date() > new Date(dueDate)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText size={20} />
          <span>Submit Assignment</span>
        </CardTitle>
        <p className="text-sm text-gray-600">{assignmentTitle}</p>
        <div className="flex items-center space-x-4 text-sm">
          <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            Due: {new Date(dueDate).toLocaleDateString()}
          </span>
          <span className="text-gray-600">Max Score: {maxScore}</span>
        </div>
        {isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm font-medium">⚠️ This assignment is overdue. Late submissions may be penalized.</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium"
              >
                Click to upload file
              </label>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, PPT, PPTX, ZIP (Max 10MB)</p>
              {selectedFile && (
                <div className="mt-3 p-2 bg-primary-50 rounded-lg">
                  <p className="text-sm font-medium text-primary-700">{selectedFile.name}</p>
                  <p className="text-xs text-primary-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Submission (Optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              rows={6}
              placeholder="Enter your text submission here..."
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Submit Assignment
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}