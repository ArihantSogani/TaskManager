import { useAuthContext } from './useAuthContext'
import { useTasksContext } from '../context/task'
import { useUserContext } from '../context/user'
import usePersist from './usePersist'
import axios from '../api/axios' 
// import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
// import pushNotificationService from '../services/pushNotification'

export const useLogout = () => {
  const { dispatch } = useAuthContext()
  const { dispatch: dispatchTasks } = useTasksContext()
  const { dispatch: dispatchUsers } = useUserContext()
  const { setPersist } = usePersist()
  const navigate = useNavigate()
  
  const logout = async () => {
    try {
      // Unsubscribe from push notifications removed
      // await pushNotificationService.unsubscribeFromPushNotifications()
      
      // Call backend logout endpoint to clear refresh token cookie
      await axios.post('/api/auth/logout')
    } catch (error) {
      console.error("Logout API call failed, but logging out client-side.", error)
    } finally {
      // Clear client-side state
      dispatch({ type: 'LOGOUT' })
      dispatchTasks({ type: 'SET_TASKS', payload: null })
      dispatchUsers({ type: 'SET_USER', payload: null })
      setPersist(false)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  return { logout }
}