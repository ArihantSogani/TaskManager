import { useRef, useState, useEffect } from 'react'
import { ROLES } from '../../config/roles'
import { BsPencilSquare } from 'react-icons/bs'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { useTasksContext } from '../../context/task'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import { AiOutlineUsergroupAdd } from 'react-icons/ai'
import AssignAdd from './assign/Add'
import CreatableReactSelect from "react-select/creatable"
const validator = require('validator')

const Edit = ({ task, forceShow, setForceShow }) => {
  const axiosPrivate = useAxiosPrivate()
  const { dispatch } =  useTasksContext()
  const { auth } = useAuthContext()
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [labels, setLabels] = useState(task.labels ? task.labels.map(label => ({ value: label.name || label, label: label.name || label })) : [])
  const [availableLabels, setAvailableLabels] = useState([])
  const titleRef = useRef('')
  const descriptionRef = useRef('')
  const statusRef = useRef('')
  const modalShow = typeof forceShow === 'boolean' ? forceShow : show;
  const modalSetShow = setForceShow || setShow;
  const isAdmin = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
  const userId = auth.id || auth.user?.id;
  const isAssignedUser = Array.isArray(task.assignedUsers) && task.assignedUsers.some(user => Number(user.id) === Number(userId));
  const [loading, setLoading] = useState(false)

  // Show title, description, and labels for both admins and assigned users
  const canEditFields = isAdmin || isAssignedUser;

  // Prepare previous values for change detection
  const prevTask = {
    title: task.title,
    description: task.description,
    status: task.status,
    labels: (task.labels || []).map(l => l.name || l)
  };

  // Fetch available labels when modal opens
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await axiosPrivate.get('/api/labels')
        setAvailableLabels(response.data)
      } catch (err) {
        console.error('Error fetching labels:', err)
      }
    }
    
    if (modalShow && isAdmin) {
      fetchLabels()
    }
  }, [modalShow, isAdmin, axiosPrivate])

  // Debug logs
  console.log('[EDIT DEBUG] Rendered for task:', task.id, 'user:', auth?.user?.name, 'userId:', userId, 'roles:', auth?.roles, 'isAdmin:', isAdmin, 'isAssignedUser:', isAssignedUser);
  console.log('Current user:', auth)
  console.log('Assigned to:', task.assignedUsers)

  const handleUpdate = async () => {
    setLoading(true)
    let updateTask = {}
    
    if (isAdmin || isAssignedUser) {
      updateTask = {
        title: titleRef.current.value,
        description: descriptionRef.current.value,
        status: statusRef.current.value,
        labels: labels.map(l => l.value)
      }
    }
    // Only keep changed fields
    Object.keys(updateTask).forEach(key => {
      if (key === 'labels') {
        const newLabels = updateTask.labels.sort();
        const oldLabels = prevTask.labels.sort();
        if (JSON.stringify(newLabels) === JSON.stringify(oldLabels)) {
          delete updateTask[key];
        }
      } else {
        if (updateTask[key] === undefined || updateTask[key] === null || validator.isEmpty(updateTask[key].toString(), { ignore_whitespace:true }) || updateTask[key] === prevTask[key]) {
          delete updateTask[key];
        }
      }
    });
    
    if (!auth) {
      setError('You must be logged in')
      return
    }

    const checkChange = Object.keys(updateTask).length === 0

    if(!checkChange){
      // alert(task.id);
      try {
        const response = await axiosPrivate.patch(`/api/tasks/${task.id}`, updateTask)
        dispatch({type: 'UPDATE_TASK', payload: response.data})
        setError(null)
        modalSetShow(false)
        setLoading(false)
        window.location.reload();
      } catch (error) {
        statusRef.current.value = task.status
        setError(error.response?.data.error)
        setLoading(false)
      }
    }else{
      setError("Nothing Changed")
      setLoading(false)
    }
  }
    
  const handleDelete = async () => {
    if(!auth) {
      setError('You must be logged in') 
      modalSetShow(false)
      return
    }

    try {
      await axiosPrivate.delete(`/api/tasks/${task.id}`)
      dispatch({type: 'DELETE_TASK', payload: task})
      setError(null)
      modalSetShow(false)
    } catch (error) {
      setError(error.response?.data.error)
    }
  }
  
  if (!isAdmin && !isAssignedUser) {
    console.log('[EDIT DEBUG] Not admin or assigned user, returning null for task:', task.id);
    return null
  }

  return (
    <>
      {typeof forceShow !== 'boolean' && (
        <button className="btn btn-outlined text-muted taskbtn" onClick={() => setShow(!show)}>
          <BsPencilSquare className="fs-5"/>
          <small>&ensp;{canEditFields ? 'EDIT' : 'UPDATE STATUS'}</small>
        </button>
      )}

      <Modal show={modalShow} onHide={() => {modalSetShow(false);setError(null)}} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{display: 'flex', alignItems: 'center', gap: 12}}>
            {canEditFields ? 'Edit Task' : 'Update Task Status'}
            {(isAdmin || isAssignedUser) && (
              <Button variant="outline-secondary" size="sm" style={{marginLeft: 0}} onClick={() => setShowAssign(true)} title="Assign User">
                <AiOutlineUsergroupAdd className="fs-5" />
              </Button>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {canEditFields && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Title:</Form.Label>
                <Form.Control type="text" defaultValue={task.title} ref={titleRef}/>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description:</Form.Label>
                <Form.Control as="textarea" rows={3} defaultValue={task.description} ref={descriptionRef}/>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Labels:</Form.Label>
                <CreatableReactSelect 
                  isMulti 
                  value={labels}
                  onChange={setLabels}
                  options={availableLabels}
                  placeholder="Add Labels..."
                  noOptionsMessage={() => "Type to create new label..."}
                  formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                />
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
          <Button variant="primary" onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
      {(isAdmin || isAssignedUser) && showAssign && (
        <AssignAdd task_id={task.id} show={showAssign} setShow={setShowAssign} />
      )}
    </>
  )
}

export default Edit