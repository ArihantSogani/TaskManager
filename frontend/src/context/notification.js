import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import { useAuthContext } from './auth'

const NotificationContext = createContext()

export const useNotificationContext = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const axiosPrivate = useAxiosPrivate()
  const { auth } = useAuthContext()

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!auth?.id) return;
    try {
      const res = await axiosPrivate.get('/api/notification')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (err) {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [axiosPrivate, auth])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Add a new notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  // Mark all as read (backend + state)
  const markAllAsRead = useCallback(async () => {
    setLoading(true)
    try {
      await axiosPrivate.post('/api/notification/read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false)
    }
  }, [axiosPrivate])

  // Mark one as read (backend + state)
  const markAsRead = useCallback(async (id) => {
    setLoading(true)
    try {
      await axiosPrivate.post('/api/notification/read', { notificationId: id })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false)
    }
  }, [axiosPrivate])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead, markAsRead, fetchNotifications, loading }}>
      {children}
    </NotificationContext.Provider>
  )
} 