import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Col, Form, Row, Stack } from "react-bootstrap"
import { ROLES } from '../../config/roles'
import { FaAddressCard } from 'react-icons/fa'
import { BsFillPersonFill } from 'react-icons/bs'
import { useAuthContext } from '../../context/auth'
import { useUserContext } from '../../context/user'
import { usePathContext } from '../../context/path'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import CreatableReactSelect from "react-select/creatable"

const Edit = () => {
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams()
  const { auth } = useAuthContext()
  const { targetUser } =  useUserContext()
  const { setTitle } = usePathContext()
  const [ error, setError ] = useState(null)
  const [ note, setNote ] = useState()
  const [ tag, setTag ] = useState([])
  const [ tagOption, setTagOption] = useState([])
  const titleRef = useRef('')
  const textRef = useRef('')

  const statusBar = {
    Root: "bg-danger",
    Admin: "bg-warning",
    User: "bg-primary"
  }
  
  const color = statusBar[targetUser?.userRoles]
  
  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()
    setTitle("Note Management")
    if(!id) navigate('/not-found')

    const getNoteList = async () => {
      try {
        let response
        const admin = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
        if(targetUser?.userId && (auth.email !== targetUser.userEmail) && admin){
          // Admin view
          response = await axiosPrivate.post('/api/notes/admin-byid', {
            id: id,
            signal: abortController.signal
          })
        }else{
          response = await axiosPrivate.get(`/api/notes/${id}`, {
            signal: abortController.signal
          })
        }
        isMounted && setNote(response.data)
        setTagOption(response.data.tag.map(t => ({ value: t, label: t })))
      } catch (err) {
        // console.log(err)
      }
    }

    if(auth){
      getNoteList()
    }

    return () => {
      isMounted = false
      abortController.abort()
    }
  },[])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!auth) {
      setError('You must be logged in')
      return
    }
    
    try {
      const tags = tag.map(t => t.value)
      const rightToEdit = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
      const updateNote = {title: titleRef.current.value, text: textRef.current.value, tag: tags}

      if(targetUser?.userId && (auth.email !== targetUser?.userEmail) && (rightToEdit)){
        updateNote.id = targetUser.userId
      }

      await axiosPrivate.patch(`/api/notes/${note._id}`, updateNote)
      setError(null)
      navigate(`/note/view/${note._id}`)
    } catch (error) {
      // console.log(error)
      setError(error.response?.data.error)
    }
  }

  return (
    <>
      {targetUser?.userName && note && (<div className={`${color} bg-opacity-25 rounded pt-2 mb-3`}>
        <span className="mx-3 d-inline-flex align-items-center"><FaAddressCard className="fs-4"/>&ensp;{targetUser?.userName}</span>
        <span className="d-inline-flex align-items-center"><BsFillPersonFill className="fs-4"/>&ensp;{targetUser?.userRoles}</span>
      </div>)}

      {note && (
        <>
          <h1 className="my-3">Edit Note</h1>
          
          <Form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Row>
                <Col>
                  <Form.Group controlId="title">
                    <Form.Label>Title</Form.Label>
                    <Form.Control defaultValue={note.title} ref={titleRef}  />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="tag">
                    <Form.Label>Tags</Form.Label>
                    <CreatableReactSelect 
                      defaultValue={tagOption}
                      isMulti
                      onChange={setTag}
                      placeholder="Edit Tag..."
                      // noOptionsMessage={() => "Nothing added!"}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group controlId="markdown">
                <Form.Label>Body</Form.Label>
                <Form.Control defaultValue={note.text} ref={textRef} as="textarea" rows={15}/>
              </Form.Group>
              {error && (<Alert variant={'danger'}>{error}</Alert>)}
              <Stack direction="horizontal" gap={2} className="justify-content-end">
                <Button type="submit" variant="primary">Save</Button>
                <Link to={`/note/view/${note._id}`}>
                  <Button type="button" variant="outline-secondary">Cancel</Button>
                </Link>
              </Stack>
            </Stack>
          </Form>
        </>
      )}
    </>
  )
}

export default Edit