import { useState, useEffect } from 'react'
import { Outlet } from "react-router-dom" 
import { useAuthContext } from '../context/auth'
import useRefreshToken from '../hooks/useRefreshToken' 
import usePersist from '../hooks/usePersist'
import Loading from './Loading'

const PersistLogin = () => {
    const refresh = useRefreshToken() 
    const { auth } = useAuthContext()
    const { persist } = usePersist()
    const [isLoading, setIsLoading] = useState(true) 

    useEffect(() => {
        let isMounted = true 

        const verifyRefreshToken = async () => {
            try {
                await refresh() 
            } catch (err) {
                console.error('Refresh token verification failed:', err) 
            } finally {
                isMounted && setIsLoading(false) 
            }
        }

        // Only verify refresh token if we don't have an access token and persist is enabled
        if (!auth?.accessToken && persist) {
            verifyRefreshToken()
        } else {
            setIsLoading(false)
        }

        return () => isMounted = false 
    }, [auth?.accessToken, persist, refresh])

    return (
        <>
            {!persist ? 
                <Outlet /> 
                : isLoading ? 
                    <Loading /> 
                    : <Outlet />}
        </>
    )
}

export default PersistLogin