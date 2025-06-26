import { useRef, useState } from 'react'
import { ROLES } from '../../config/roles'
import { FaAddressCard } from 'react-icons/fa'
import { BsFillPersonFill } from 'react-icons/bs'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Col, Form, Row, Stack } from "react-bootstrap"
import { useAuthContext } from '../../context/auth'
import { useUserContext } from '../../context/user'
import CreatableReactSelect from "react-select/creatable"
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const Add = () => {
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const { auth } = useAuthContext()
  const { targetUser } =  useUserContext()
  const [ error, setError ] = useState(null)
  const [ tag, setTag ] = useState([])
  const titleRef = useRef('')
  const textRef = useRef('')

  const statusBar = {
    Root: "bg-danger",
    Admin: "bg-warning",
    User: "bg-primary"
  }

  const color = statusBar[targetUser?.userRoles]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!auth) {
      setError('You must be logged in')
      return
    }
    
    try {
      const tags = tag.map(t => t.value)
      const rightToAdd = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
      const note = {title: titleRef.current.value, text: textRef.current.value, tag: tags}

      if(targetUser?.userId && (auth.email !== targetUser?.userEmail) && (rightToAdd)){
        note.id = targetUser.userId
      }

      await axiosPrivate.post('/api/notes', note)
      setError(null)
      navigate('/note')
    } catch (error) {
      setError(error.response?.data.error)
      // console.log(error)
    }
  }
  
  return (
    <>
      {targetUser?.userName && (<div className={`${color} bg-opacity-25 rounded pt-2 mb-3`}>
        <span className="mx-3 d-inline-flex align-items-center"><FaAddressCard className="fs-4"/>&ensp;{targetUser?.userName}</span>
        <span className="d-inline-flex align-items-center"><BsFillPersonFill className="fs-4"/>&ensp;{targetUser?.userRoles}</span>
      </div>)}

      <h1 className="my-3">New Note</h1>

      <Form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Row>
            <Col>
              <Form.Group controlId="title">
                <Form.Label>Title</Form.Label>
                <Form.Control ref={titleRef} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="tag">
                <Form.Label>Tags</Form.Label>
                <CreatableReactSelect 
                  isMulti 
                  onChange={setTag}
                  placeholder="Add Tag..."
                  noOptionsMessage={() => "Nothing added!"}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group controlId="markdown">
            <Form.Label>Body</Form.Label>
            <Form.Control as="textarea" ref={textRef} rows={15}/>
          </Form.Group>
          {error && (<Alert variant={'danger'}>{error}</Alert>)}
          <Stack direction="horizontal" gap={2} className="justify-content-end">
            <Button type="submit" variant="primary">Save</Button>
            <Link to="/note">
              <Button type="button" variant="outline-secondary">Cancel</Button>
            </Link>
          </Stack>
        </Stack>
      </Form>
    </>
  )
}

export default Add