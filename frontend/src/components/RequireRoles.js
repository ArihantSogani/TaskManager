import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../context/auth'

const RequireRoles = ({ Roles }) => {
    const { auth } = useAuthContext()
    const checkRoles = auth.roles.find(role => Roles.includes(role))
    return (checkRoles && auth ? <Outlet /> : <Navigate to="/" />) 
}

export default RequireRoles 