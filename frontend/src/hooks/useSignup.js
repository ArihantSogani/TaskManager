import { useState } from 'react'
import { useAuthContext } from '../context/auth'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import jwt_decode from 'jwt-decode'
import { toast } from 'react-toastify'

export const useSignup = () => {
  const navigate = useNavigate()
  const { dispatch } = useAuthContext()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)

  
  const signup = async (name, email, password, persist) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/signup', { name, email, password, persist })
      console.log('Signup successful, API response:', response.data)
      const accessToken = response.data
      const decoded = jwt_decode(accessToken)
      
      const authPayload = { 
        accessToken,
        userInfo: decoded.userInfo
      }
      console.log('Dispatching LOGIN with payload:', authPayload)
      // Save auth context
      dispatch({ 
        type: 'LOGIN', 
        payload: authPayload
      })

      setIsLoading(false)
      console.log('Returning success from useSignup.')
      
      // Show success message and navigate to dashboard
      toast.success(`Welcome ${decoded.userInfo.name}!`)
      navigate('/')
      return { success: true, name: decoded.userInfo.name }
    } catch (error) {
      setIsLoading(false)
      console.error('Signup error:', error.response?.data || error.message)
      setError(error.response?.data?.error || error.message || 'Signup failed')
      return { success: false }
    }
  }

  return { signup, isLoading, error }
}