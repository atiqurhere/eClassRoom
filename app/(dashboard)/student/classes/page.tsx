'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Video, FileText, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function StudentClassesPage() {
  const classes = [
    { id: '1', name: 'Mathematics', teacher: 'Mr. Smith', assignments: 3, materials: 12, schedule: 'Mon, Wed, Fri 9:00 AM', hasLiveClass: true },
    { id: '2', name: 'Physics', teacher: 'Dr. Johnson', assignments: 2, materials: 10, schedule: 'Tue, Thu 11:00 AM', hasLiveClass: false },
    { id: '3', name: 'English', teacher: 'Ms. Davis', assignments: 4, materials: 15, schedule: 'Mon, Wed 2:00 PM', hasLiveClass: false },
    { id: '4', name: 'Chemistry', teacher: 'Dr. Brown', assignments: 2, materials: 8, schedule: 'Tue, Fri 10:00 AM', hasLiveClass: false },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">View your enrolled classes and materials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{course.name}</CardTitle>
                {course.hasLiveClass && (
                  <span className="flex items-center text-green-600 text-xs font-medium">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{course.teacher}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <FileText size={16} className="mr-2" />
                    {course.assignments} Assignments
                  </div>
                  <div className="flex items-center text-gray-600">
                    <BookOpen size={16} className="mr-2" />
                    {course.materials}
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  {course.schedule}
                </div>
                <div className="pt-3">
                  {course.hasLiveClass ? (
                    <Button size="sm" className="w-full mb-2" asChild>
                      <Link href={`/student/live-class/${course.id}`}>
                        <Video size={16} className="mr-1" />
                        Join Live Class
                      </Link>
                    </Button>
                  ) : null}
                  <Button size="sm" variant="secondary" className="w-full" asChild>
                    <Link href={`/student/classes/${course.id}`}>
                      View Materials & Assignments
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
