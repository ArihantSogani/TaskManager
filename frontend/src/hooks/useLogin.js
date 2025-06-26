import { useState } from 'react'
import { useAuthContext } from '../context/auth'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios' 
import jwt_decode from 'jwt-decode'
import { toast } from 'react-toastify'

export const useLogin = () => {
  const navigate = useNavigate()
  const { dispatch } = useAuthContext()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)


  const handleBack = () => {
    navigate("/")
  }
  const login = async (email, password, persist) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/login', { email, password, persist })
      console.log('Login successful, API response:', response.data)
      const decoded = jwt_decode(response.data)

      const authPayload = { ...decoded.userInfo, accessToken: response.data }
      console.log('Dispatching LOGIN with payload:', authPayload)
      dispatch({type: 'LOGIN', payload: authPayload})
      // Save to localStorage for persistence
      localStorage.setItem('accessToken', response.data);
      localStorage.setItem('user', JSON.stringify(decoded.userInfo));
      setIsLoading(false)
      
      // Show success message and navigate to dashboard
      toast.success(`Welcome back ${decoded.userInfo.name}!`)
      // navigate('/')
      handleBack();
    } catch (error) {
      setIsLoading(false)
      setError(error.response?.data?.error || error.message || 'Login failed')
    }
  }

  return { login, isLoading, error }
}