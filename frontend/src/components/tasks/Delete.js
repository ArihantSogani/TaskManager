import { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { BsFillTrashFill } from 'react-icons/bs'
import { GoAlert } from 'react-icons/go'
import { useTasksContext } from '../../context/task'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const Delete = ({ task }) => {
  const axiosPrivate = useAxiosPrivate()
  const { dispatch } =  useTasksContext()
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
      const response = await axiosPrivate.delete(`/api/tasks/${task._id}`)
      dispatch({type: 'DELETE_TASK', payload: response.data})
      setError(null)
      setShow(false)
    } catch (error) {
      // console.log(error)
      setError(error.response?.data.error)
    }
  }

  return (
    <>
      <button className="btn btn-outlined text-muted taskbtn" onClick={() => setShow(!show)}> <BsFillTrashFill className="fs-5"/><small>&ensp;DELETE</small></button>

      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered>
        <Modal.Header closeButton>
          {!error && (<Modal.Title className="d-inline-flex align-items-center"><GoAlert/>&nbsp;Warning</Modal.Title>)}
          {error && (<Modal.Title>Error</Modal.Title>)}
        </Modal.Header> 
        <Modal.Body>
          {!error && (<>Are you sure, delete task: <strong>{task.title}</strong> ?</>)}
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