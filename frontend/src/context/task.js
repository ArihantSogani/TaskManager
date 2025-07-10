import { createContext, useReducer, useState, useContext, useEffect } from 'react'
import { socket } from '../socket'

export const TasksContext = createContext()

export const tasksReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TASKS':
      return { tasks: Array.isArray(action.payload) ? action.payload : [] }
    case 'CREATE_TASK':
      return { tasks: [action.payload, ...(Array.isArray(state.tasks) ? state.tasks : [])] }
    case 'UPDATE_TASK':
      return {
        tasks: (Array.isArray(state.tasks) ? state.tasks : []).map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      }
    case 'DELETE_TASK':
      return { tasks: (Array.isArray(state.tasks) ? state.tasks : []).filter(t => t.id !== action.payload.id) }
    default:
      return { tasks: Array.isArray(state.tasks) ? state.tasks : [] }
  }
}

export const TasksContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tasksReducer, { tasks: null })
  const [assignedUser, setAssignedUser] = useState([])

  useEffect(() => {
    socket.on('task-updated', (updatedTask) => {
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
    })
    socket.on('task-deleted', (deletedTaskId) => {
      dispatch({ type: 'DELETE_TASK', payload: { id: deletedTaskId } })
    })
    return () => {
      socket.off('task-updated')
      socket.off('task-deleted')
    }
  }, [dispatch])

  return (<TasksContext.Provider value={{ ...state, dispatch, assignedUser, setAssignedUser }}>{ children }</TasksContext.Provider>)
}

export const useTasksContext = () => {
  const context = useContext(TasksContext)
  if(!context) throw Error('useTasksContext must be used inside an TasksContextProvider')
  return context
}