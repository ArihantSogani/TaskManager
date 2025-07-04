import { useRef, useState } from 'react'
import { ROLES } from '../../config/roles'
import { BsPencilSquare } from 'react-icons/bs'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useTasksContext } from '../../context/task'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import { AiOutlineUsergroupAdd } from 'react-icons/ai'
import AssignAdd from './assign/Add'
import { useNavigate } from 'react-router-dom'
const validator = require('validator')

const Edit = ({ task, forceShow, setForceShow }) => {
  const axiosPrivate = useAxiosPrivate()
  const { dispatch } =  useTasksContext()
  const { auth } = useAuthContext()
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const titleRef = useRef('')
  const descriptionRef = useRef('')
  const statusRef = useRef('')
  const modalShow = typeof forceShow === 'boolean' ? forceShow : show;
  const modalSetShow = setForceShow || setShow;
  const navigate = useNavigate();

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
        modalSetShow(false)
      } catch (error) {
        statusRef.current.value = task.status
        setError(error.response?.data.error)
      }
    }else{
      setError("Nothing Changed")
    }
  }
    
  const handleDelete = async () => {
    if(!auth) {
      setError('You must be logged in') 
      modalSetShow(false)
      return
    }

    try {
      await axiosPrivate.delete(`/api/tasks/${task._id}`)
      dispatch({type: 'DELETE_TASK', payload: task})
      setError(null)
      modalSetShow(false)
    } catch (error) {
      setError(error.response?.data.error)
    }
  }
  
  if (!isAdmin && !isAssignedUser) {
    return null
  }

  return (
    <>
      {typeof forceShow !== 'boolean' && (
        <button className="btn btn-outlined text-muted taskbtn" onClick={() => setShow(!show)}>
          <BsPencilSquare className="fs-5"/>
          <small>&ensp;{isAdmin ? 'EDIT' : 'UPDATE STATUS'}</small>
        </button>
      )}

      <Modal show={modalShow} onHide={() => {modalSetShow(false);setError(null)}} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{display: 'flex', alignItems: 'center', gap: 12}}>
            {isAdmin ? 'Edit Task' : 'Update Task Status'}
            {(isAdmin || isAssignedUser) && (
              <Button variant="outline-secondary" size="sm" style={{marginLeft: 0}} onClick={() => setShowAssign(true)} title="Assign User">
                <AiOutlineUsergroupAdd className="fs-5" />
              </Button>
            )}
          </Modal.Title>
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
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </Form.Group>
          {error && (<Alert variant={'danger'}>{error}</Alert>)}
        </Modal.Body>
        <Modal.Footer>
          {isAdmin && (
            <Button variant="danger" onClick={handleDelete}>Delete Task</Button>
          )}
          <Button variant="primary" onClick={handleUpdate}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
      {(isAdmin || isAssignedUser) && showAssign && (
        <AssignAdd task_id={task._id} show={showAssign} setShow={setShowAssign} />
      )}
    </>
  )
}

export default Edit