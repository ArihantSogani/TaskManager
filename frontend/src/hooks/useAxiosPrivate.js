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
                if (error.response?.status === 403 && error.response?.data.error === "Forbidden token expired" && !prevRequest?._retry) {
                    prevRequest._retry = true 
                    const newAccessToken = await refresh() 
                    prevRequest['headers'] = {Authorization:`Bearer ${newAccessToken}`}
                    return axiosPrivate(prevRequest) 
                }

                // Only logout for true auth errors
                const forbidden = error.response?.status === 403 && error.response?.data.error === "Forbidden"
                const isAuthError = error.response?.status === 401 && (
                  error.response?.data?.error === 'Unauthorized' ||
                  error.response?.data?.error === 'Invalid token' ||
                  error.response?.data?.error === 'Token not found' ||
                  error.response?.data?.error === 'Token expired' ||
                  error.response?.data?.error === 'Forbidden token expired'
                )

                if( forbidden || isAuthError ){
                    logout()
                    return
                }

                // For other 401s (like not authorized to update task), just reject
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