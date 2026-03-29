'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, BookOpen, Video, Bell } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AdminDashboard() {
  const { user } = useAuth()

  const stats = [
    { name: 'Total Users', value: '248', icon: Users, color: 'bg-blue-500' },
    { name: 'Active Classes', value: '12', icon: BookOpen, color: 'bg-green-500' },
    { name: 'Live Classes', value: '3', icon: Video, color: 'bg-red-500' },
    { name: 'Notifications', value: '45', icon: Bell, color: 'bg-yellow-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                    <Bell size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New user registered</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Live Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Mathematics - Class 10A</p>
                    <p className="text-xs text-gray-500">45 students online</p>
                  </div>
                  <span className="flex items-center text-green-600 text-xs font-medium">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                    Live
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
