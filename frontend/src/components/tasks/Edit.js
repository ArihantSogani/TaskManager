import { useRef, useState } from 'react'
import { ROLES } from '../../config/roles'
import { BsPencilSquare } from 'react-icons/bs'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useTasksContext } from '../../context/task'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
const validator = require('validator')

const Edit = ({ task }) => {
  const axiosPrivate = useAxiosPrivate()
  const { dispatch } =  useTasksContext()
  const { auth } = useAuthContext()
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const titleRef = useRef('')
  const descriptionRef = useRef('')
  const statusRef = useRef('')

  const isAdmin = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
  const isAssignedUser = task.assignedTo.some(user => user._id === auth._id)

  // Debug logs
  console.log('Current user:', auth)
  console.log('Assigned to:', task.assignedTo)

  const handleUpdate = async () => {
    let updateTask = {}
    
    if (isAdmin) {
      updateTask = {
        title: titleRef.current.value,
        description: descriptionRef.current.value,
        status: statusRef.current.value
      }
    } else if (isAssignedUser) {
      updateTask = { status: statusRef.current.value }
    }

    const prevTask = isAdmin ? 
      [task.title, task.description, task.status] :
      [task.status]

    Object.keys(updateTask).forEach(key => {
      if (validator.isEmpty(updateTask[key].toString(), { ignore_whitespace:true }) || prevTask.includes(updateTask[key])) {
        delete updateTask[key]
      }
    })
    
    if (!auth) {
      setError('You must be logged in')
      return
    }

    const checkChange = Object.keys(updateTask).length === 0

    if(!checkChange){
      // alert(task._id);
      try {
        const response = await axiosPrivate.patch(`/api/tasks/${task._id}`, updateTask)
        dispatch({type: 'UPDATE_TASK', payload: response.data})
        setError(null)
        setShow(false)
      } catch (error) {
        statusRef.current.value = task.status
        setError(error.response?.data.error)
      }
    }else{
      setError("Nothing Changed")
    }
  }
    
  
  if (!isAdmin && !isAssignedUser) {
    return null
  }

  return (
    <>
      <button className="btn btn-outlined text-muted taskbtn" onClick={() => setShow(!show)}>
        <BsPencilSquare className="fs-5"/>
        <small>&ensp;{isAdmin ? 'EDIT' : 'UPDATE STATUS'}</small>
      </button>

      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isAdmin ? 'Edit Task' : 'Update Task Status'}</Modal.Title>
        </Modal.Header> 
        <Modal.Body>
          {isAdmin && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Title:</Form.Label>
                <Form.Control type="text" defaultValue={task.title} ref={titleRef}/>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description:</Form.Label>
                <Form.Control as="textarea" rows={3} defaultValue={task.description} ref={descriptionRef}/>
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Status:</Form.Label>
            <select className="form-select" aria-label="select status" defaultValue={task.status} ref={statusRef}>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Expired">Expired</option>
            </select>
          </Form.Group>
          {error && (<Alert variant={'danger'}>{error}</Alert>)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleUpdate}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Edit