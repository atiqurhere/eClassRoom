import { createClient } from '@/lib/supabase/client'
import { Notification, NotificationType, NotificationTargetRole } from '@/types/database.types'

export const notificationService = {
  // Get notifications for current user
  async getNotifications(limit: number = 50) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Notification[]
  },

  // Mark notification as read
  async markAsRead(id: string) {
    const supabase = createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) throw error
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const supabase = createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)

    if (error) throw error
  },

  // Create notification (admin/teacher only)
  async createNotification(notification: {
    title: string
    message: string
    type: NotificationType
    targetRole?: NotificationTargetRole
    classId?: string
    userId?: string
    link?: string
  }) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(callback: (notification: Notification) => void) {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // Get unread count
  async getUnreadCount() {
    const supabase = createClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  },
}