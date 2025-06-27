import axios from '../api/axios' 
import { useAuthContext } from '../context/auth' 
import { useLogout } from '../hooks/useLogout'
import jwt_decode from 'jwt-decode'

const useRefreshToken = () => {
    const { dispatch } = useAuthContext()
    const { logout } = useLogout()

    const refresh = async () => {
        try {
            const response = await axios.post('/api/auth/refresh') 
            const decoded = jwt_decode(response.data)
            dispatch({type: 'LOGIN', payload: {...decoded.userInfo, accessToken: response.data}})
            return response.data
        } catch (error) {
            // Only logout for actual authentication failures
            const isAuthError = error.response?.status === 401 && (
                error.response?.data?.error === 'Unauthorized' ||
                error.response?.data?.error === 'Refresh token expired' ||
                error.response?.data?.error === 'Invalid refresh token'
            )
            const isBlocked = error.response?.status === 400 && error.response?.data?.error === 'Your account has been blocked'
            
            if (isAuthError || isBlocked) {
                logout()
                return null
            }
            
            // For other errors, throw the error to be handled by the caller
            throw error
        }
    }
    return refresh 
} 

export default useRefreshToken 