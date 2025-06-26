import { useRef, useState } from 'react'
import { ROLES } from '../../../config/roles'
import { FaTags } from 'react-icons/fa'
import { BsPencilSquare, BsFillTrashFill } from 'react-icons/bs'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useUserContext } from '../../../context/user'
import { useAuthContext } from '../../../context/auth'
import useAxiosPrivate from '../../../hooks/useAxiosPrivate'
const validator = require('validator')

const Edit = ({user}) => {
  const axiosPrivate = useAxiosPrivate()
  const { dispatch } =  useUserContext()
  const { auth } = useAuthContext()
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const tagRef = useRef('')


  const handleDelete =  (e) => {

  }

  const handleUpdate = async () => {
  const updateTag = { tag: tagRef.current.value }
//   const prevUser  = [user.name, user.email, user.roles[0], user.active]

//   Object.keys(updateUser).forEach(key => {
//     if (validator.isEmpty(updateUser[key].toString(), { ignore_whitespace:true }) || prevUser.includes(updateUser[key])) {
//       delete updateUser[key]
//     }
//   })
  
//   if (!auth) {
//     setError('You must be logged in')
//     return
//   }

//   const checkChange = Object.keys(updateUser).length === 0

//   if(!checkChange){
//     updateUser.id = user._id

//     if(updateUser.roles){
//       updateUser.roles = [rolesRef.current.value]
//     }

//     try {
//       const response = await axiosPrivate.patch('/api/users', updateUser)
//       dispatch({type: 'UPDATE_USER', payload: response.data})
//       setError(null)
//       setShow(false)
//     } catch (error) {
//       rolesRef.current.value = user.roles
//       activeRef.current.checked = user.active
//       setError(error.response?.data.error)
//     }
//   }else{
//     setError("Nothing Changed")
//   }
}
    
  return (
    <>
      <button className="btn btn-outline-primary mb-2" onClick={() => setShow(!show)}><BsPencilSquare />&ensp;<FaTags /></button>
      
      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Tags</Modal.Title>
        </Modal.Header> 
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tags: </Form.Label>
            <div className="d-flex">
              <Form.Control type="text" ref={tagRef} />&ensp;
              <Button variant="danger" onClick={handleDelete}><BsFillTrashFill /></Button>
            </div>
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