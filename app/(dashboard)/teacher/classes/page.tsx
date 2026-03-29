'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Video, Users, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TeacherClassesPage() {
  const classes = [
    { id: '1', name: 'Mathematics', class: 'Class 10A', students: 45, assignments: 8, schedule: 'Mon, Wed, Fri 9:00 AM' },
    { id: '2', name: 'Physics', class: 'Class 10B', students: 42, assignments: 6, schedule: 'Tue, Thu 11:00 AM' },
    { id: '3', name: 'Mathematics', class: 'Class 9A', students: 38, assignments: 7, schedule: 'Mon, Wed 2:00 PM' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">Manage your classes, assignments, and students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
              <p className="text-sm text-gray-600">{course.class}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users size={16} className="mr-2" />
                    {course.students} Students
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FileText size={16} className="mr-2" />
                    {course.assignments}
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  {course.schedule}
                </div>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/teacher/live-class/${course.id}`}>
                      <Video size={16} className="mr-1" />
                      Start Class
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/teacher/classes/${course.id}`}>
                      View Details
                    </Link>
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
