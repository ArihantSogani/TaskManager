import { useEffect, useState } from 'react'
import { ROLES } from '../../config/roles'
import { Link, useNavigate, useParams } from "react-router-dom"
import { Badge, Button, Col, Row, Stack } from "react-bootstrap"
import { BiArrowBack } from 'react-icons/bi'
import { FaAddressCard } from 'react-icons/fa'
import { BsPencilSquare, BsFillTrashFill, BsFillPersonFill } from 'react-icons/bs'
import { usePathContext } from '../../context/path'
import { useUserContext } from '../../context/user'
import { useAuthContext } from '../../context/auth'
import useAxiosPrivate from "../../hooks/useAxiosPrivate"
import ReactMarkdown from "react-markdown"

const View = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { auth } = useAuthContext()
  const { setTitle } = usePathContext()
  const { targetUser } = useUserContext()
  const [ notes, setNotes ] = useState()
  const axiosPrivate = useAxiosPrivate()

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
        isMounted && setNotes(response.data)
      } catch (err) {
        // console.log(err)
        if(err.response?.status === 404) {
          navigate('/note')
        }
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

  const deleteNote = async () => {
    try {
      await axiosPrivate.delete(`/api/notes/${id}`)
      navigate('/note', {replace: true})
    } catch (error) {
      // console.log(error)
    }
  }

  const handleBack = () => {
    setTitle("Note Management")
    navigate("/note")
  }

  return (
    <>
      {targetUser?.userName && notes && (<div className={`${color} bg-opacity-25 rounded pt-2 mb-3`}>
        <span className="mx-3 d-inline-flex align-items-center"><FaAddressCard className="fs-4"/>&ensp;{targetUser?.userName}</span>
        <span className="d-inline-flex align-items-center"><BsFillPersonFill className="fs-4"/>&ensp;{targetUser?.userRoles}</span>
      </div>)}

      {/* {notes && ( */}
        <>
          <Row className="align-items-center mb-4">
            <Col>
              <h1>{notes?.title}</h1>
              {!notes?.length && (
                <Stack gap={1} direction="horizontal" className="flex-wrap">
                  {notes?.tag.map((tags, index) => (
                    <Badge className="text-truncate" key={index}>{tags}</Badge>
                  ))}
                </Stack>
              )}
            </Col>
            <Col xs="auto">
              <Stack gap={2} direction="horizontal">
                <Link to={`/note/edit/${id}`}>
                  <Button variant="outline-primary" onClick={() => navigate(`/note/edit/${id}`, {replace: true})}><BsPencilSquare /></Button>
                </Link>
                <Button variant="outline-danger" onClick={deleteNote}><BsFillTrashFill /></Button>
                <Button variant="outline-secondary" onClick={handleBack}><BiArrowBack /></Button>
              </Stack>
            </Col>
          </Row>
          
          <ReactMarkdown>{notes?.text}</ReactMarkdown>
        </>
      {/* )} */}
    </>
  )
}

export default View