import { useContext } from 'react'
import { AuthContext } from '../context/auth'

export const useAuthContext = () => useContext(AuthContext) 