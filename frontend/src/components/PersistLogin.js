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
            }catch (err) {
                console.error(err) 
            }finally {
                isMounted && setIsLoading(false) 
            }
        }

        !auth?.accessToken && persist ? verifyRefreshToken() : setIsLoading(false) 

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