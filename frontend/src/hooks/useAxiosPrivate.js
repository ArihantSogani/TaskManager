import { useEffect } from "react" 
import { axiosPrivate } from "../api/axios" 
import { useAuthContext } from '../context/auth'
import { useLogout } from './useLogout'
import useRefreshToken from './useRefreshToken' 

const useAxiosPrivate = () => {
    const { logout } = useLogout()
    const { auth } = useAuthContext()
    const refresh = useRefreshToken() 

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            config => {
                if (!config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${auth?.accessToken}`
                }
                return config 
            }, (error) => Promise.reject(error)
        ) 

        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response,
            async (error) => {
                const prevRequest = error?.config
                
                // Handle token expiration by attempting refresh
                if (error.response?.status === 403 && error.response?.data.error === "Forbidden token expired" && !prevRequest?._retry) {
                    prevRequest._retry = true 
                    try {
                        const newAccessToken = await refresh() 
                        if (newAccessToken) {
                            prevRequest['headers'] = {Authorization:`Bearer ${newAccessToken}`}
                            return axiosPrivate(prevRequest) 
                        }
                    } catch (refreshError) {
                        // If refresh fails, then logout
                        logout()
                        return Promise.reject(refreshError)
                    }
                }

                // Only logout for actual authentication failures, not just token expiration
                const isAuthError = error.response?.status === 401 && (
                  error.response?.data?.error === 'Unauthorized' ||
                  error.response?.data?.error === 'Invalid token' ||
                  error.response?.data?.error === 'Token not found' ||
                  error.response?.data?.error === 'Refresh token expired' ||
                  error.response?.data?.error === 'Invalid refresh token'
                )

                // Handle account blocked
                const isBlocked = error.response?.status === 400 && error.response?.data?.error === 'Your account has been blocked'

                if (isAuthError || isBlocked) {
                    logout()
                    return Promise.reject(error)
                }

                // For other errors, just reject without logging out
                return Promise.reject(error) 
            }
        ) 

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept) 
            axiosPrivate.interceptors.response.eject(responseIntercept) 
        }
    }, [auth, refresh, logout])

    return axiosPrivate 
}

export default useAxiosPrivate 