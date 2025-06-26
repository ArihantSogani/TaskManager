import { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { GoAlert } from 'react-icons/go'
import { BsFillTrashFill } from 'react-icons/bs'
import { useAuthContext } from '../../../context/auth'
import { useTasksContext } from '../../../context/task'
import useAxiosPrivate from '../../../hooks/useAxiosPrivate'

const Delete = ({ user }) => {
  const axiosPrivate = useAxiosPrivate()
  const { assignedUser, setAssignedUser } =  useTasksContext()
  const { auth } = useAuthContext()
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)

  const handleDelete = async () => {
    if(!auth) {
      setError('You must be logged in') 
      setShow(!show)
      return
    }

    try {
      const response = await axiosPrivate.delete(`/api/tasks/assign/${assignedUser._id}`, {data: {user_id: user._id}})
      setAssignedUser(response.data)
      setError(null)
      setShow(false)
    } catch (error) {
      // console.log(error)
      setError(error.response.data.error)
    }
  }

  return (
    <>
      <button className="btn btn-outline-danger p-1" onClick={() => setShow(!show)}><BsFillTrashFill className="fs-4"/></button>

      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered>
        <Modal.Header closeButton>
          {!error && (<Modal.Title className="d-inline-flex align-items-center"><GoAlert/>&nbsp;Warning</Modal.Title>)}
          {error && (<Modal.Title>Error</Modal.Title>)}
        </Modal.Header> 
        <Modal.Body>
          {!error && (<>Are you sure, unassign this user - <strong>{user.name}</strong> ?</>)}
          {error && (<div className="alert alert-danger" role="alert">{error}</div>)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
          <Button variant="secondary" onClick={() => setShow(!show)}>Cancel</Button>
        </Modal.Footer>
    </Modal>
    </>
  )
}

export default Delete