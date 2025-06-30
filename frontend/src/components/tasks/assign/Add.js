import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsPlusLg } from 'react-icons/bs'
import { BiArrowBack } from 'react-icons/bi'
import { Modal, Button } from 'react-bootstrap'
import { usePathContext } from '../../../context/path'
import { useTasksContext } from '../../../context/task'
import useAxiosPrivate from '../../../hooks/useAxiosPrivate'
// import { FaUserPlus } from 'react-icons/fa'
import { useAuthContext } from '../../../hooks/useAuthContext'
import { socket } from '../../../socket'

const Add = ({ task_id }) => {
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const { setTitle } = usePathContext()
  const { setAssignedUser } = useTasksContext()
  const { auth } = useAuthContext()

  const [notAssignedUser, setNotAssignedUser] = useState([])
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const nameRef = useRef()

  useEffect(() => {
    // socketRef.current = io()
    // return () => socketRef.current.disconnect()
  }, [])

  const handleClick = async () => {
    setShow(true)

    try {
      const response = await axiosPrivate.get(`/api/tasks/unassigned/${task_id}`)
      setNotAssignedUser(response.data)
      setError(null)
      if (response.data.length === 0) setError('No idle users found')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const selectedUserIds = Array.from(nameRef.current.selectedOptions, opt => opt.value)
    if (selectedUserIds.length === 0) {
      setError('No user selected')
      return
    }

    try {
      const response = await axiosPrivate.post('/api/tasks/assign', {
        task_id,
        user_id: selectedUserIds
      })

      setAssignedUser(response.data)
      setError(null)
      setShow(false)

      // socketRef.current.emit('assign-task', { task_id, user_id: selectedUserIds })
      socket.emit('assign-task', { task_id, user_id: selectedUserIds })
    } catch (err) {
      setError(err.response?.data?.error || 'Error assigning task')
    }
  }

  const handleBack = () => {
    setTitle('Task Management')
    navigate('/task')
  }

  return (
    <>
      <div className="d-flex justify-content-between mb-2">
        <button className="btn btn-outline-primary" onClick={handleBack}><BiArrowBack /></button>
        <button className="btn btn-outline-primary" onClick={handleClick}><BsPlusLg /></button>
      </div>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notAssignedUser.length > 0 ? (
            <select
              className="form-select"
              multiple
              size="5"
              aria-label="Multiple select"
              ref={nameRef}
            >
              {notAssignedUser.map((user, idx) => (
                <option key={idx} value={user._id}>{user.name}</option>
              ))}
            </select>
          ) : (
            <div>No available users to assign.</div>
          )}

          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </Modal.Body>
        {notAssignedUser.length > 0 && (
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmit}>Assign</Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  )
}

export default Add
