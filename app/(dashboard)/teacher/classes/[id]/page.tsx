'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AssignmentForm } from '@/components/assignments/AssignmentForm'
import { Plus, FileText, Calendar, Users } from 'lucide-react'
import { useState } from 'react'

export default function TeacherClassDetailPage() {
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)

  // Mock data - replace with Supabase queries
  const classInfo = {
    id: '1',
    name: 'Mathematics',
    className: 'Class 10A',
    students: 45,
  }

  const assignments = [
    { id: '1', title: 'Algebra Assignment 5', dueDate: '2026-03-20', submissions: 32, maxScore: 100 },
    { id: '2', title: 'Geometry Worksheet', dueDate: '2026-03-25', submissions: 28, maxScore: 50 },
    { id: '3', title: 'Trigonometry Problems', dueDate: '2026-03-30', submissions: 0, maxScore: 75 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{classInfo.name}</h1>
        <p className="text-gray-600">{classInfo.className} • {classInfo.students} Students</p>
      </div>

      {/* Create Assignment Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
          <Button onClick={() => setShowCreateAssignment(!showCreateAssignment)}>
            <Plus size={16} className="mr-2" />
            Create Assignment
          </Button>
        </div>

        {showCreateAssignment && (
          <div className="mb-6">
            <AssignmentForm
              courseId={classInfo.id}
              onSuccess={() => setShowCreateAssignment(false)}
            />
          </div>
        )}
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={16} className="mr-2" />
                  {assignment.submissions}/{classInfo.students} submitted
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText size={16} className="mr-2" />
                  Max Score: {assignment.maxScore}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(assignment.submissions / classInfo.students) * 100}%` }}
                  ></div>
                </div>
                <div className="pt-2 flex space-x-2">
                  <Button size="sm" className="flex-1">
                    View Submissions
                  </Button>
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}