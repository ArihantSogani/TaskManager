import { useState } from 'react'
import axios from '../api/axios'

export const useSignup = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)

  
  

  const signup = async (name, email, password, persist) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/signup', { name, email, password, persist })
      console.log('Signup successful, API response:', response.data)
      // Do not decode token, set auth, or dispatch LOGIN here
      setIsLoading(false)
      return { success: true, name }
    } catch (error) {
      setIsLoading(false)
      console.error('Signup error:', error.response?.data || error.message)
      setError(error.response?.data?.error || error.message || 'Signup failed')
      return { success: false }
    }
  }

  return { signup, isLoading, error }
}