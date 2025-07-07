import Delete from './Delete'
import View from './View'
import Add from './Add'
// import Edit from './Edit'
import { ROLES } from '../../config/roles'
import { MdOutlineWifi, MdOutlineWifiOff  } from 'react-icons/md'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const Index = ({ filteredNames }) => {
  const { auth } = useAuthContext()
  const axiosPrivate = useAxiosPrivate()

  const permitDeleteUser = (auth, user) => {
    return (!auth.roles.includes(ROLES.Admin) && !user.roles.includes(ROLES.Root)) || user.roles.includes(ROLES.User)
  }

  const handleToggleActive = async (user) => {
    try {
      await axiosPrivate.patch('/api/users', { id: user._id, active: !user.active })
      // Optionally, trigger a refresh or update state here if needed
      window.location.reload(); // Simple way to reflect the change
    } catch (error) {
      alert('Failed to update user status')
    }
  }

  return (
    <>
      {auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root) ? <Add /> : null}
      {filteredNames.map((user, index)=> {
        console.log('User:', user.name, 'Roles:', user.roles, 'Type:', typeof user.roles);
        // const isAdmin = Array.isArray(user.roles) ? user.roles.includes('Admin') : user.roles === 'Admin';
        return (
          <tr key={index}>
            <td>{index + 1 + '.'}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.roles}</td>
            <td>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" checked={user.active} onChange={() => handleToggleActive(user)} />
              </div>
            </td>
            <td>{user.isOnline ? <MdOutlineWifi className='text-success' size={25}/> : <MdOutlineWifiOff className='text-secondary' size={25}/>}</td>
            <td>{user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-GB') : ''}</td>
            <td>
              <View user={user}/>
              <span style={{ marginLeft: '8px' }}>
                {permitDeleteUser(auth, user) && (<Delete user={ user }/>) }
              </span>
            </td>
          </tr>
        )
      })}
    </>
  )
}

export default Index