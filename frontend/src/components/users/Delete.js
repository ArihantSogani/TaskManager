import { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { BsFillTrashFill } from 'react-icons/bs'
import { GoAlert } from 'react-icons/go'
import { useUserContext } from '../../context/user'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const Delete = ({user}) => {
  const axiosPrivate = useAxiosPrivate()
  const { dispatch } =  useUserContext()
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
      const response = await axiosPrivate.delete(`/api/users/${user._id}`)
      dispatch({type: 'DELETE_USER', payload: response.data})
      setError(null)
      setShow(false)
    } catch (error) {
      // console.log(error)
      setError(error.response?.data.error)
    }
  }

  return (
    <>
      <button className="btn btn-outline-danger p-1" onClick={() => setShow(!show)}><BsFillTrashFill className="fs-4"/></button>
      
      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered>
        <Modal.Header closeButton>
          {!error && (<Modal.Title className="d-inline-flex align-items-center"><GoAlert className="text-danger"/>&nbsp;Warning</Modal.Title>)}
          {error && (<Modal.Title>Error</Modal.Title>)}
        </Modal.Header> 
        <Modal.Body>
          {!error && (<>Are you sure, delete user <strong>{user.name}</strong> ?</>)}
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