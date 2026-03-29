'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function AdminClassesPage() {
  // This will be connected to Supabase later
  const classes = [
    { id: '1', name: 'Class 10A', teacher: 'Mr. Smith', students: 45, courses: 8 },
    { id: '2', name: 'Class 10B', teacher: 'Dr. Johnson', students: 42, courses: 8 },
    { id: '3', name: 'Class 9A', teacher: 'Ms. Davis', students: 38, courses: 7 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-1">Manage all classes and assign teachers</p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" />
          Add Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id}>
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={16} className="mr-2" />
                  {classItem.students} Students
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpen size={16} className="mr-2" />
                  {classItem.courses} Courses
                </div>
                <p className="text-sm text-gray-600">Teacher: {classItem.teacher}</p>
                <div className="pt-3 flex space-x-2">
                  <Button size="sm" variant="ghost" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1">
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
