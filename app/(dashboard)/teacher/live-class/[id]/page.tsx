'use client'

import { useParams, useRouter } from 'next/navigation'
import { JitsiMeeting } from '@/components/live-class/JitsiMeeting'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function TeacherLiveClassPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const classId = params.id as string
  // In a real app, fetch class details from Supabase
  const className = 'Mathematics - Class 10A'
  const roomId = `class_${classId}_${Date.now()}`

  const handleMeetingEnd = () => {
    toast.success('Class ended successfully')
    router.push('/teacher/classes')
  }

  return (
    <div className="h-[calc(100vh-7rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{className}</h1>
            <p className="text-sm text-gray-600">Live Class Session</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-green-600 text-sm font-medium">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100%-5rem)]">
        {user && (
          <JitsiMeeting
            roomName={roomId}
            userName={user.full_name}
            userEmail={user.email}
            isModerator={true}
            onMeetingEnd={handleMeetingEnd}
          />
        )}
      </div>
    </div>
  )
}
