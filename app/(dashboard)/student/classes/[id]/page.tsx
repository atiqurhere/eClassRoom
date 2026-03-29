'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SubmissionForm } from '@/components/assignments/SubmissionForm'
import { Button } from '@/components/ui/Button'
import { FileText, Download, Clock, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function StudentClassDetailPage() {
  const [showSubmissionForm, setShowSubmissionForm] = useState<string | null>(null)

  // Mock data - replace with Supabase queries
  const classInfo = {
    id: '1',
    name: 'Mathematics',
    teacher: 'Mr. Smith',
  }

  const assignments = [
    {
      id: '1',
      title: 'Algebra Assignment 5',
      description: 'Solve algebraic equations and show your work',
      dueDate: '2026-03-20T23:59',
      maxScore: 100,
      status: 'pending',
      submitted: false,
    },
    {
      id: '2',
      title: 'Geometry Worksheet',
      description: 'Complete geometry problems from chapter 8',
      dueDate: '2026-03-25T23:59',
      maxScore: 50,
      status: 'submitted',
      submitted: true,
      grade: 45,
      feedback: 'Good work! Minor calculation error in problem 5.',
    },
    {
      id: '3',
      title: 'Trigonometry Problems',
      description: 'Practice trigonometric functions and identities',
      dueDate: '2026-03-30T23:59',
      maxScore: 75,
      status: 'upcoming',
      submitted: false,
    },
  ]

  const materials = [
    { id: '1', title: 'Chapter 8 Notes', type: 'PDF', size: '2.3 MB' },
    { id: '2', title: 'Practice Problems', type: 'PDF', size: '1.8 MB' },
    { id: '3', title: 'Formula Sheet', type: 'PDF', size: '0.5 MB' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{classInfo.name}</h1>
        <p className="text-gray-600">Teacher: {classInfo.teacher}</p>
      </div>

      {/* Assignments Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignments</h2>
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const isOverdue = new Date() > new Date(assignment.dueDate)
            const isShowingSubmission = showSubmissionForm === assignment.id

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {assignment.status === 'submitted' && (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle size={16} className="mr-1" />
                          Submitted
                        </span>
                      )}
                      {assignment.status === 'pending' && isOverdue && (
                        <span className="flex items-center text-red-600 text-sm font-medium">
                          <Clock size={16} className="mr-1" />
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{assignment.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Due Date:</span>
                      <p className={isOverdue ? 'text-red-600' : 'text-gray-600'}>
                        {new Date(assignment.dueDate).toLocaleDateString()} at{' '}
                        {new Date(assignment.dueDate).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Max Score:</span>
                      <p className="text-gray-600">{assignment.maxScore} points</p>
                    </div>
                    {assignment.grade !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Your Score:</span>
                        <p className="text-green-600 font-medium">
                          {assignment.grade}/{assignment.maxScore}
                        </p>
                      </div>
                    )}
                  </div>

                  {assignment.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-blue-900 mb-1">Teacher Feedback:</h4>
                      <p className="text-blue-800 text-sm">{assignment.feedback}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {!assignment.submitted && !isOverdue && (
                      <Button
                        onClick={() => setShowSubmissionForm(isShowingSubmission ? null : assignment.id)}
                        className="flex-1"
                      >
                        Submit Assignment
                      </Button>
                    )}
                    {assignment.submitted && (
                      <Button variant="secondary" className="flex-1">
                        View Submission
                      </Button>
                    )}
                  </div>

                  {isShowingSubmission && (
                    <div className="mt-4">
                      <SubmissionForm
                        assignmentId={assignment.id}
                        assignmentTitle={assignment.title}
                        dueDate={assignment.dueDate}
                        maxScore={assignment.maxScore}
                        onSuccess={() => setShowSubmissionForm(null)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Materials Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Materials</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{material.title}</p>
                      <p className="text-sm text-gray-600">{material.type} • {material.size}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}