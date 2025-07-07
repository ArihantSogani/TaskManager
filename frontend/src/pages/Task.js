import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BiArrowBack } from 'react-icons/bi'
import { useUserContext } from '../context/user'
import { useAuthContext } from '../context/auth'
import { useTasksContext } from '../context/task'
import { usePathContext } from '../context/path'
import { ROLES } from '../config/roles'
import { FaAddressCard } from "react-icons/fa"
import { BsFillPersonFill } from "react-icons/bs"
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import Details from '../components/tasks/Index'
import Add from '../components/tasks/Add'
import TaskSummary from '../components/TaskSummary'
import TaskFilter from '../components/TaskFilter'
import { getTaskCategory } from '../utils/taskDateCategory'

const Task = () => {
  const navigate = useNavigate()
  const { auth } = useAuthContext()
  const { targetUser } = useUserContext()
  const { setTitle } = usePathContext()
  const { tasks, dispatch } =  useTasksContext()
  const [ error, setError ] = useState(null)
  const [ filter, setFilter ] = useState('all')
  const axiosPrivate = useAxiosPrivate()
  const admin = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
  const [searchTerm, setSearchTerm] = useState('')

  const statusBar = {
    Root: "bg-danger",
    Admin: "bg-warning",
    User: "bg-primary"
  }
  
  const color = statusBar[targetUser?.userRoles]

  const handleBack = () => {
    setTitle("ComplyRelax")
    navigate("/")
  }

  // Filter tasks based on due date, status, and assigned user search
  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    let filtered = []
    switch (filter) {
      case 'completed':
        filtered = tasks.filter(task => task.status === 'Completed')
        break
      case 'all':
        filtered = tasks.filter(task => task.status !== 'Completed')
        break
      case 'overdue':
        filtered = tasks.filter(task => getTaskCategory(task) === 'overdue')
        break
      case 'urgent':
        filtered = tasks.filter(task => getTaskCategory(task) === 'urgent')
        break
      case 'upcoming':
        filtered = tasks.filter(task => getTaskCategory(task) === 'upcoming')
        break
      case 'future':
        filtered = tasks.filter(task => getTaskCategory(task) === 'future')
        break
      default:
        filtered = tasks.filter(task => task.status !== 'Completed')
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(task =>
        Array.isArray(task.assignedTo) &&
        task.assignedTo.some(user => user?.name?.toLowerCase().includes(term))
      )
    }
    return filtered
  }, [tasks, filter, searchTerm])

  useEffect(() => {
    setTitle("Task Management")
    let isMounted = true
    const abortController = new AbortController()

    const getAllTask = async () => {
      try {
        const endpoint = targetUser?.userId && admin ? '/api/tasks/inspect' : '/api/tasks'
        const method = targetUser?.userId && admin ? 'post' : 'get'
        const data = targetUser?.userId && admin ? { id: targetUser.userId } : undefined
  
        const response = await axiosPrivate({
          method,
          url: endpoint,
          data,
          signal: abortController.signal
        })
  
        isMounted && dispatch({ type: 'SET_TASKS', payload: response.data })
        setError(null)
      } catch (err) {
        dispatch({ type: 'SET_TASKS', payload: [] })
        setError(err.response?.data.error)
        
      }
    }

    if(auth){
      getAllTask()
    }

    return () => {
      isMounted = false
      abortController.abort()
    }
  },[ auth, targetUser, setTitle, axiosPrivate, dispatch, admin ])

  return (
    <>
      {auth && (
        <>
          {targetUser?.userName && tasks && (<div className={`${color} bg-opacity-25 rounded pt-2 mb-3`}>
            <span className="mx-3 d-inline-flex align-items-center"><FaAddressCard className="fs-4"/>&ensp;{targetUser?.userName}</span>
            <span className="d-inline-flex align-items-center"><BsFillPersonFill className="fs-4"/>&ensp;{targetUser?.userRoles}</span>
          </div>)}

          {/* Top row: Add (+) button and search bar for admins */}
          {admin && (
            <div className="d-flex justify-content-between align-items-center mb-3">
              {/* Left: Back button */}
              <button className="btn btn-outline-primary mb-2" onClick={handleBack}><BiArrowBack /></button>
              {/* Right: Add (+) and search bar */}
              <div className="d-flex align-items-center gap-2">
                <span className="me-3"><Add /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by assigned user's name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchTerm(searchTerm)}
                  type="button"
                >
                  Search
                </button>
                {searchTerm && (
                  <button
                    className="btn btn-outline-danger ms-2"
                    onClick={() => setSearchTerm('')}
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* For non-admin users, show back button row */}
          {auth.roles.includes(ROLES.User) && (
            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-primary mb-2" onClick={handleBack}><BiArrowBack /></button>
            </div>
          )}
          
          {/* Task Summary Overview */}
          {tasks && tasks.length > 0 && <TaskSummary tasks={tasks} />}
          
          {/* Task Filter */}
          {tasks && tasks.length > 0 && <TaskFilter filter={filter} setFilter={setFilter} />}
          
          {filteredTasks && <Details tasks={filteredTasks}/>}
          {error && !tasks?.length && <div className="error">{error}</div>}
          {filteredTasks && filteredTasks.length === 0 && tasks && tasks.length > 0 && (
            <div className="text-center text-muted py-4">
              <p>No tasks match the selected filter.</p>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default Task