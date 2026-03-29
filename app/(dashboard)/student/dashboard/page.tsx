'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookOpen, FileText, Video, Clock } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function StudentDashboard() {
  const { user } = useAuth()

  const stats = [
    { name: 'Enrolled Classes', value: '6', icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Pending Assignments', value: '4', icon: FileText, color: 'bg-red-500' },
    { name: 'Live Classes', value: '1', icon: Video, color: 'bg-green-500' },
    { name: 'Attendance', value: '92%', icon: Clock, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.full_name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Classes & Upcoming Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '09:00 AM', class: 'Mathematics', teacher: 'Mr. Smith', status: 'upcoming' },
                { time: '11:00 AM', class: 'Physics', teacher: 'Dr. Johnson', status: 'live' },
                { time: '02:00 PM', class: 'English', teacher: 'Ms. Davis', status: 'upcoming' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.class}</p>
                    <p className="text-xs text-gray-500">{item.time} • {item.teacher}</p>
                  </div>
                  {item.status === 'live' ? (
                    <Button size="sm" asChild>
                      <Link href="/student/live-class">Join Now</Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-500">Upcoming</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Algebra Assignment 5', subject: 'Mathematics', dueDate: 'Tomorrow', urgent: true },
                { name: 'Physics Lab Report', subject: 'Physics', dueDate: '3 days', urgent: false },
                { name: 'English Essay', subject: 'English', dueDate: '5 days', urgent: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${item.urgent ? 'text-red-600' : 'text-gray-600'}`}>
                      Due {item.dueDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
