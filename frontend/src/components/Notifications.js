import React, { useEffect } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import { socket } from '../socket'
import { toast } from 'react-toastify'
import { useNotificationContext } from '../context/notification'
// import axios from '../api/axios'

const Notifications = () => {
  const { auth } = useAuthContext()
  const { addNotification } = useNotificationContext()

  // Debug: confirm component is mounted and auth value
  console.log('Notifications component mounted, auth:', auth)

  useEffect(() => {
    if (auth) {
      // Connect to socket.io with user authentication
      socket.auth = { userId: auth._id }
      console.log('Connecting socket with userId:', auth._id)
      socket.connect()

      // Listen for new notifications
      socket.on('notification', (data) => {
        console.log('Received notification event:', data)
        toast.info(data.data.message)
        addNotification({
          id: Date.now() + Math.random(),
          message: data.data.message,
          time: new Date().toLocaleTimeString(),
          read: false
        })
      })

      // Listen for task updates
      socket.on('taskUpdate', (data) => {
        toast.info(data.data.message)
        addNotification({
          id: Date.now() + Math.random(),
          message: data.data.message,
          time: new Date().toLocaleTimeString(),
          read: false
        })
      })

      // Listen for new comments
      socket.on('taskComment', (data) => {
        toast.info(data.data.message)
        addNotification({
          id: Date.now() + Math.random(),
          message: data.data.message,
          time: new Date().toLocaleTimeString(),
          read: false
        })
      })
    }

    return () => {
      if (socket) {
        socket.off('notification')
        socket.off('taskUpdate')
        socket.off('taskComment')
        socket.disconnect()
      }
    }
  }, [auth, addNotification])

  // Do not render any notification tab or UI
  return null
}

export default Notifications 