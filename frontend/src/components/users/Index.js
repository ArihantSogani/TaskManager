import Delete from './Delete'
import View from './View'
import Add from './Add'
// import Edit from './Edit'
// import { BsThreeDotsVertical } from 'react-icons/bs'
import { ROLES } from '../../config/roles'
// import { MdOutlineWifi } from 'react-icons/md'
// import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
// import { useState } from 'react'
// import { Modal, Button } from 'react-bootstrap'

const Index = ({ filteredNames }) => {
  const { auth } = useAuthContext()
  const axiosPrivate = useAxiosPrivate()
  // const [openMenu, setOpenMenu] = useState(null)
  // const [showActionModal, setShowActionModal] = useState(false)
  // const [selectedUser, setSelectedUser] = useState(null)

  const permitDeleteUser = (auth, user) => {
    return (!auth.roles.includes(ROLES.Admin) && !user.roles.includes(ROLES.Root)) || user.roles.includes(ROLES.User)
  }

  const handleToggleActive = async (user) => {
    try {
      await axiosPrivate.patch('/api/users', { id: user.id, active: !user.active })
      window.location.reload();
    } catch (error) {
      alert('Failed to update user status')
    }
  }

  return (
    <>
      {auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root) ? <Add /> : null}
      {filteredNames.map((user, index)=> {
        console.log('User:', user.name, 'Roles:', user.roles, 'Type:', typeof user.roles);
        
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
            {/* Comment out the Active Status WiFi icon column */}
            {/* <td>{user.is_online ? <MdOutlineWifi style={{ color: 'green' }} size={25}/> : <MdOutlineWifi style={{ color: 'gray' }} size={25}/>}</td> */}
            <td>{user.last_active ? new Date(user.last_active).toLocaleDateString('en-GB') : ''}</td>
            <td style={{ minWidth: 100 }}>
              <div className="d-flex flex-row justify-content-center align-items-center gap-2">
                <View user={user} buttonStyle={{ minWidth: 36, minHeight: 36, padding: 4, fontSize: 16 }} />
                {auth.roles.includes(ROLES.Admin) && permitDeleteUser(auth, user) && (
                  <Delete user={user} buttonStyle={{ minWidth: 36, minHeight: 36, padding: 4, fontSize: 16 }} />
                )}
              </div>
            </td>
          </tr>
        )
      })}
     
    </>
  )
}

export default Index