'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookOpen, FileText, Users, Calendar } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function TeacherDashboard() {
  const { user } = useAuth()

  const stats = [
    { name: 'My Classes', value: '4', icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Assignments', value: '12', icon: FileText, color: 'bg-green-500' },
    { name: 'Total Students', value: '156', icon: Users, color: 'bg-purple-500' },
    { name: 'Today\'s Classes', value: '2', icon: Calendar, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
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

      {/* Today's Schedule & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '09:00 AM', class: 'Mathematics - Class 10A', students: 45 },
                { time: '11:00 AM', class: 'Physics - Class 10B', students: 42 },
                { time: '02:00 PM', class: 'Mathematics - Class 9A', students: 38 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.class}</p>
                    <p className="text-xs text-gray-500">{item.time} • {item.students} students</p>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/teacher/live-class">Start</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { assignment: 'Algebra Assignment 5', submissions: 32, total: 45 },
                { assignment: 'Physics Lab Report', submissions: 28, total: 42 },
                { assignment: 'Geometry Worksheet', submissions: 35, total: 38 },
              ].map((item, i) => (
                <div key={i} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{item.assignment}</p>
                    <span className="text-xs text-gray-500">{item.submissions}/{item.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(item.submissions / item.total) * 100}%` }}
                    ></div>
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
