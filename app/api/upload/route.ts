import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/services/storage.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'avatar', 'assignment', 'submission', 'material'
    const assignmentId = formData.get('assignmentId') as string
    const courseId = formData.get('courseId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let uploadedUrl: string

    switch (type) {
      case 'avatar':
        // Validate image file
        storageService.validateFile(
          file,
          ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
          2 * 1024 * 1024 // 2MB
        )
        uploadedUrl = await storageService.uploadAvatar(user.id, file)

        // Update user profile
        await supabase
          .from('users')
          .update({ avatar_url: uploadedUrl })
          .eq('id', user.id)
        break

      case 'assignment':
        // Check if user is teacher
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'teacher') {
          return NextResponse.json({ error: 'Only teachers can upload assignments' }, { status: 403 })
        }

        storageService.validateFile(
          file,
          [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ],
          10 * 1024 * 1024 // 10MB
        )
        uploadedUrl = await storageService.uploadAssignmentFile(user.id, assignmentId, file)
        break

      case 'submission':
        storageService.validateFile(
          file,
          [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip',
          ],
          10 * 1024 * 1024 // 10MB
        )
        uploadedUrl = await storageService.uploadSubmissionFile(user.id, assignmentId, file)
        break

      case 'material':
        // Check if user is teacher
        const { data: teacherProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (teacherProfile?.role !== 'teacher') {
          return NextResponse.json({ error: 'Only teachers can upload materials' }, { status: 403 })
        }

        storageService.validateFile(
          file,
          [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ],
          10 * 1024 * 1024 // 10MB
        )
        uploadedUrl = await storageService.uploadMaterial(user.id, courseId, file)
        break

      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    return NextResponse.json({ url: uploadedUrl })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bucket, path } = await request.json()

    if (!bucket || !path) {
      return NextResponse.json({ error: 'Bucket and path are required' }, { status: 400 })
    }

    await storageService.deleteFile(bucket, path)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}