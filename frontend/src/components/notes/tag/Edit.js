import { useRef, useState } from 'react'
import { FaTags } from 'react-icons/fa'
import { BsPencilSquare, BsFillTrashFill } from 'react-icons/bs'
import { Alert, Button, Form, Modal } from 'react-bootstrap'


const Edit = ({user}) => {
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const tagRef = useRef('')


  const handleDelete =  (e) => {

  }

  const handleUpdate = async () => {
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