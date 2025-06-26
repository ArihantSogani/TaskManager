import { useAuthContext } from '../context/auth'
import { useUserContext } from '../context/user'
import usePersist from './usePersist'
import axios from '../api/axios' 
import io from 'socket.io-client'
import { useNavigate } from 'react-router-dom'

export const useLogout = () => {
  const { dispatch } = useAuthContext()
  const { dispatch: dispatchUsers } = useUserContext()
  const { setPersist } = usePersist()
  const navigate = useNavigate()
  
  const logout = async () => {
    try {
      const socket = io(process.env.SERVER_SOCKET_URL)
      await axios.post('/api/auth/logout')
      socket.emit('disconnet')
    } catch (error) {
      console.error("Logout API call failed, but logging out client-side.", error)
    } finally {
      dispatch({ type: 'LOGOUT' })
      dispatchUsers({ type: 'SET_USER', payload: null })
      setPersist(false)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login')
    }
  }

  return { logout }
}