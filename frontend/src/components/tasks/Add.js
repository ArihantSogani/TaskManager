import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { usePathContext } from '../../context/path'
import { useTasksContext } from '../../context/task'
import { useAuthContext } from '../../context/auth'
import { BiArrowBack } from 'react-icons/bi'
import { BsPlusLg } from 'react-icons/bs'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const Add = () => {
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const { setTitle } = usePathContext()
  const { dispatch } =  useTasksContext()
  const { auth } = useAuthContext()
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const titleRef = useRef('')
  const descriptionRef = useRef('')
  const priorityRef = useRef('Medium')
  const dueDateRef = useRef('')

  // Fetch all users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosPrivate.get('/api/users')
        setUsers(response.data)
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }
    
    if (show && auth?.roles?.includes('Admin')) {
      fetchUsers()
    }
  }, [show, auth, axiosPrivate])

  const handleAdd = async () => {
    if (!auth) {
      setError('You must be logged in')
      return
    }
   
    try {
      const response = await axiosPrivate.post('/api/tasks', {
        title: titleRef.current.value,
        description: descriptionRef.current.value,
        priority: priorityRef.current.value,
        dueDate: dueDateRef.current.value || null,
        assignedTo: selectedUsers
      })
      dispatch({type: 'CREATE_TASK', payload: response.data})
      setError(null)
      setShow(false)
      setSelectedUsers([])
      // Clear form
      titleRef.current.value = ''
      descriptionRef.current.value = ''
      priorityRef.current.value = 'Medium'
      dueDateRef.current.value = ''
    } catch (error) {
      setError(error.response?.data.error)
    }
  }

  const handleBack = () => {
    setTitle("Welcome")
    navigate("/")
  }

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-primary mb-2" onClick={handleBack}><BiArrowBack /></button>
        <button className="btn btn-outline-primary mb-2" onClick={() => setShow(!show)}><BsPlusLg /></button>
      </div>

      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>New Task</Modal.Title>
        </Modal.Header> 
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Title:</Form.Label>
            <Form.Control type="text" ref={titleRef}/>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description:</Form.Label>
            <Form.Control as="textarea" rows={3} ref={descriptionRef}/>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Priority:</Form.Label>
            <Form.Select ref={priorityRef}>
              <option value="Low">Low</option>
              <option value="Medium" selected>Medium</option>
              <option value="High">High</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Due Date:</Form.Label>
            <Form.Control type="datetime-local" ref={dueDateRef}/>
          </Form.Group>
          {auth?.roles?.includes('Admin') && (
            <Form.Group className="mb-3">
              <Form.Label>Assign to Team Members:</Form.Label>
              <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '10px'}}>
                {users.map(user => (
                  <Form.Check
                    key={user._id}
                    type="checkbox"
                    id={`user-${user._id}`}
                    label={`${user.name} (${user.email})`}
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelection(user._id)}
                  />
                ))}
              </div>
            </Form.Group>
          )}
          {error && (<Alert variant={'danger'}>{error}</Alert>)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {setShow(!show);setError(null)}}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add Task</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Add