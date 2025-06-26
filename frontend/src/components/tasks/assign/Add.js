import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsPlusLg } from 'react-icons/bs'
import { BiArrowBack } from 'react-icons/bi'
import { Modal, Button } from 'react-bootstrap'
import { usePathContext } from '../../../context/path'
import { useTasksContext } from '../../../context/task'
import useAxiosPrivate from '../../../hooks/useAxiosPrivate'

const Add = ({ task_id }) => {
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const { setTitle } = usePathContext()
  const { setAssignedUser } =  useTasksContext()
  const [notAssignedUser, setNotAssignedUser] = useState([])
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef()

  const handleClick = async () => {
    setShow(!show)

    try {
      const response = await axiosPrivate.get(`/api/tasks/unassigned/${task_id}`)
      setNotAssignedUser(response.data)
      setError(null)
      if(response.data.length === 0) setError("No idle users found")
    } catch (err) {
      // console.log(err)
      setError(err.response.data.error)
    }
  }

  const handleAssign = async () => {
    const seletedUser = Array.from(nameRef.current.selectedOptions, option => option.value)
    if(seletedUser.length === 0){
      setShow(true)
      setError("No user seleted")
      return
    }

    try {
      const response = await axiosPrivate.post('/api/tasks/assign', {
        task_id: task_id,
        user_id: seletedUser
      }) 
      setAssignedUser(response.data)
      setError(null)
      setShow(false)
    } catch (error) {
      setError(error.response?.data.error)
    }
  }

  const handleBack = () => {
    setTitle("Task Management")
    navigate("/task")
  }

  return (
    <>
      <div className="d-flex justify-content-between mb-2">
        <button className="btn btn-outline-primary mb-2" onClick={handleBack}><BiArrowBack /></button>
        <button className="btn btn-outline-primary mb-2" onClick={handleClick}><BsPlusLg /></button>
      </div>

      <Modal show={show} onHide={() => {setShow(!show)}} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-inline-flex align-items-center">Assign User</Modal.Title>
        </Modal.Header> 
        <Modal.Body>
          {!(notAssignedUser.length === 0) && (<select className="form-select" multiple size="5" aria-label="multiple select user" ref={nameRef}>
            {notAssignedUser.map((n, index) => (
              <option value={n._id} key={index}>{n.name}</option>
            ))}
          </select>)}
          {error && (<div className="alert alert-danger mt-3" role="alert">{error}</div>)}
        </Modal.Body>
        {!(notAssignedUser.length === 0) && (<Modal.Footer>
          <Button variant="primary" onClick={handleAssign}>Assign</Button>
        </Modal.Footer>)}
      </Modal>  
  </>
  )
}

export default Add