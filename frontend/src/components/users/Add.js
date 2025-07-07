import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { usePathContext } from '../../context/path'
import { useUserContext } from '../../context/user'
import { useAuthContext } from '../../context/auth'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { BiArrowBack } from 'react-icons/bi'
import { BsPlusLg } from 'react-icons/bs'
import { ROLES } from '../../config/roles'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const Add = ({ show: showProp, setShow: setShowProp }) => {
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const { setTitle } = usePathContext()
  const { dispatch } =  useUserContext()
  const { auth } = useAuthContext()
  const [ error, setError ] = useState(null)
  const [ showInternal, setShowInternal ] = useState(false)
  const show = typeof showProp === 'boolean' ? showProp : showInternal
  const setShow = setShowProp || setShowInternal
  const [ changeIcon, setChangeIcon ] = useState(false)
  const [ active, setActive ] = useState(false)
  const nameRef = useRef('')
  const emailRef = useRef('')
  const passwordRef = useRef('')
  const rolesRef = useRef([])
  const activeRef = useRef('')

  const handleShowPassword =  (e) => {
    e.preventDefault()
    const isPassword = passwordRef.current.type === "password"
    passwordRef.current.type = isPassword ? "text" : "password"
    setChangeIcon(isPassword)
  }

  const handleAdd = async () => {
    if (!auth) {
      setError('You must be logged in')
      return
    }

    const addUser = { name: nameRef.current.value, email: emailRef.current.value, password: passwordRef.current.value, roles: [rolesRef.current.value], active: activeRef.current.checked}
   
    try {
      const response = await axiosPrivate.post('/api/users', addUser)
      dispatch({type: 'CREATE_USER', payload: response.data})
      setError(null)
      setShow(false)
    } catch (error) {
      // console.log(error)
      setError(error.response?.data.error)
    }
  }

  const handleBack = () => {
    setTitle("ComplyRelax")
    navigate("/")
  }

  return (
    <>
      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered>
        <Modal.Header closeButton>
          <Modal.Title>New User</Modal.Title>
        </Modal.Header> 
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name:</Form.Label>
            <Form.Control type="text" ref={nameRef} placeholder="Enter name" defaultValue="" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email:</Form.Label>
            <Form.Control type="text" ref={emailRef} placeholder="Enter email" defaultValue="" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password: </Form.Label>
            <div className="d-flex">
              <Form.Control type="password" ref={passwordRef} autoComplete="on" placeholder="Enter password" defaultValue="" />
              <Button variant="default" className="mb-2" onClick={handleShowPassword}>{changeIcon ? <FaEyeSlash/> : <FaEye/>}</Button>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Roles:</Form.Label>
            <select className="form-select" aria-label="select roles" ref={rolesRef} defaultValue={"User"}>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicCheckbox">
            <Form.Label>Active:</Form.Label>
            <Form.Check type="switch" ref={activeRef} defaultChecked={active} onClick={() => setActive(!active)}/>
          </Form.Group>
          {error && (<Alert variant={'danger'}>{error}</Alert>)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAdd}>Add User</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Add