import { useEffect, useMemo, useState } from 'react'
import { ROLES } from '../config/roles'
import { GoSearch } from "react-icons/go"
import { useAuthContext } from '../context/auth'
import { useUserContext } from '../context/user'
import { usePathContext } from '../context/path'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import Details from '../components/users/Index'
import { socket } from '../socket'
import { BiArrowBack } from 'react-icons/bi'

const User = () => {
  const { auth } = useAuthContext()
  const { setTitle } = usePathContext()
  const { users, dispatch } = useUserContext()
  const [ query, setQuery ] = useState("")
  const [ notFound, setNotFound ] = useState(false)
  const axiosPrivate = useAxiosPrivate()
  const isAdminOrRoot = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
  const admin = auth && isAdminOrRoot
  // const [error, setError] = useState(null)
  // const [success, setSuccess] = useState(null)
  
  useEffect(() => {
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

    // Ensure socket is connected before emitting online event
    if (socket.connected) {
      socket.emit('online', auth.id)
    } else {
      socket.on('connect', () => {
        socket.emit('online', auth.id)
      })
    }
    
    socket.on('adminUpdateUserList', (user) => {
      console.log('Received adminUpdateUserList event:', user)
      dispatch({type: 'SET_USER', payload: user})
    })

    socket.on('user-update', (data) => {
      // Handle user update
    })

    return () => {
      isMounted = false
      socket.off('adminUpdateUserList')
      socket.off('rootUpdateUserList')
      socket.off('connect')
      abortController.abort()
    }
  },[ auth, dispatch, axiosPrivate, setTitle ])

  const filteredNames = useMemo(() => users?.filter(user => user.name.toLowerCase().includes(query.toLowerCase())), [users, query])

  // Debug logs
  console.log('All users from context:', users);
  console.log('Filtered names for table:', filteredNames);

  return (
    <>
      {admin && (
        <>
          <button className="btn btn-outline-primary mb-2" onClick={() => { setTitle('ComplyRelax'); window.history.back(); }}><BiArrowBack /></button>
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
                  <th scope="col">Active Date</th>
                  <th scope="col">Action</th>
                  {/* <th scope="col">Action</th> */}
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