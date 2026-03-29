import { createClient } from '@/lib/supabase/client'

export const storageService = {
  // Upload file to Supabase Storage
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { upsert?: boolean }
  ) {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: options?.upsert || false,
      })

    if (error) throw error
    return data
  },

  // Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    const supabase = createClient()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  // Get signed URL for private file
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
  },

  // Upload avatar
  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    await this.uploadFile('avatars', filePath, file, { upsert: true })
    return this.getPublicUrl('avatars', filePath)
  },

  // Upload assignment file
  async uploadAssignmentFile(teacherId: string, assignmentId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${assignmentId}_${Date.now()}.${fileExt}`
    const filePath = `${teacherId}/assignments/${fileName}`

    await this.uploadFile('assignments', filePath, file)
    return this.getSignedUrl('assignments', filePath)
  },

  // Upload submission file
  async uploadSubmissionFile(
    studentId: string,
    assignmentId: string,
    file: File
  ) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${assignmentId}_${Date.now()}.${fileExt}`
    const filePath = `${studentId}/submissions/${fileName}`

    await this.uploadFile('submissions', filePath, file)
    return this.getSignedUrl('submissions', filePath)
  },

  // Upload course material
  async uploadMaterial(teacherId: string, courseId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${courseId}_${Date.now()}_${file.name}`
    const filePath = `${teacherId}/materials/${fileName}`

    await this.uploadFile('materials', filePath, file)
    return this.getSignedUrl('materials', filePath)
  },

  // Validate file
  validateFile(file: File, allowedTypes: string[], maxSize: number) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }

    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`)
    }

    return true
  },
}