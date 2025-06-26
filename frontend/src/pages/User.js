import { useEffect, useMemo, useState } from 'react'
import { ROLES } from '../config/roles'
import { GoSearch } from "react-icons/go"
import { useAuthContext } from '../context/auth'
import { useUserContext } from '../context/user'
import { usePathContext } from '../context/path'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import Details from '../components/users/Index'
import Add from '../components/users/Add'
import io from 'socket.io-client'

const User = () => {
  const { auth } = useAuthContext()
  const { setTitle } = usePathContext()
  const { users, dispatch } = useUserContext()
  const [ query, setQuery ] = useState("")
  const [ notFound, setNotFound ] = useState(false)
  const axiosPrivate = useAxiosPrivate()
  const isAdminOrRoot = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
  const admin = auth && isAdminOrRoot
  
  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL)

    setTitle("User Management")
    let isMounted = true
    const abortController = new AbortController()
    
    const getAllUser = async () => {
      try {
        const response = await axiosPrivate.get('/api/users', {
          signal: abortController.signal
        })
        isMounted && dispatch({type: 'SET_USER', payload: response.data})
      } catch (err) {
        // console.log(err)
        setNotFound(true)
      }
    }
    
    if(auth){
      getAllUser()
    }

    socket.emit('online', auth._id)
    
    socket.on('rootUpdateUserList', (user) => {
      dispatch({type: 'SET_USER', payload: user})
    })

    socket.on('adminUpdateUserList', (user) => {
      dispatch({type: 'SET_USER', payload: user})
    })

    return () => {
      isMounted = false
      socket.off('adminUpdateUserList')
      abortController.abort()
    }
  },[])

  const filteredNames = useMemo(() => users?.filter(user => user.name.toLowerCase().includes(query.toLowerCase())), [users, query])

  return (
    <>
      {admin && (
        <>
          <Add />
          
          <div className="input-group mt-2 mb-3">
            <input type="search" className="form-control" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)}/>
            <button className="btn btn-outline-primary" type="button"><GoSearch/></button>
          </div>

          {users && (
            <table className="table table-hover mt-2">
              <thead className="table-light">
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Roles</th>
                  <th scope="col">Account Status</th>
                  <th scope="col">Active Status</th>
                  <th scope="col">Active Date</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <Details filteredNames={filteredNames}/>
              </tbody>
            </table>
          )}
        </>
      )}

      {!filteredNames?.length && query && <div>No matching results found...</div>}

      {notFound && !query && !users?.length && (<div>No Record Found...</div>)}
    </>
  )
}

export default User