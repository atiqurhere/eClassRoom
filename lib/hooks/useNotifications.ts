'use client'

import { useEffect, useState } from 'react'
import { notificationService } from '@/lib/services/notification.service'
import { Notification } from '@/types/database.types'
import { toast } from 'sonner'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    const unsubscribe = subscribeToNotifications()

    return () => {
      unsubscribe()
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data)
      updateUnreadCount(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    return notificationService.subscribeToNotifications((newNotification) => {
      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Show toast for new notification
      toast.info(newNotification.title, {
        description: newNotification.message,
        action: newNotification.link
          ? {
              label: 'View',
              onClick: () => window.location.href = newNotification.link!,
            }
          : undefined,
      })
    })
  }

  const updateUnreadCount = (notificationsList?: Notification[]) => {
    const list = notificationsList || notifications
    const count = list.filter((n) => !n.is_read).length
    setUnreadCount(count)
  }

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}