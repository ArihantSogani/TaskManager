import { useEffect, useMemo, useState } from 'react'
import { Col, Row, Stack } from "react-bootstrap"
import { GoSearch } from "react-icons/go"
import { BiArrowBack } from 'react-icons/bi'
import { FaAddressCard, FaTags } from "react-icons/fa"
import { BsFillPersonFill, BsPlusLg, BsPencilSquare } from "react-icons/bs"
import { Link } from "react-router-dom"
import { ROLES } from '../config/roles'
import { useNavigate } from 'react-router-dom'
import { usePathContext } from '../context/path'
import { useUserContext } from '../context/user'
import { useAuthContext } from '../context/auth'
import CreatableReactSelect from "react-select/creatable"
import useAxiosPrivate from "../hooks/useAxiosPrivate"
import Details from '../components/notes/Index'
// import Edit from '../components/notes/tag/Edit'

const Note = () => {
  const navigate = useNavigate()
  const { setTitle } = usePathContext()
  const { auth } = useAuthContext()
  const { targetUser } = useUserContext()
  const [ notes, setNotes ] = useState()
  const [ tag, setTag ] = useState([])
  const [ titles, setTitles ] = useState("")
  const [ notFound, setNotFound ] = useState(false)
  const axiosPrivate = useAxiosPrivate()
  const admin = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)

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

    const getNoteList = async () => {
      try {
        const endpoint = targetUser?.userId && admin ? '/api/notes/admin-all' : '/api/notes'
        const method = targetUser?.userId && admin ? 'post' : 'get'
        const data = targetUser?.userId && admin ? { id: targetUser.userId } : undefined
  
        const response = await axiosPrivate({
          method,
          url: endpoint,
          data,
          signal: abortController.signal
        })

        isMounted && setNotes(response.data)
      } catch (err) {
        setNotes()
        setNotFound(true)
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

  const filteredNote = useMemo(() => notes?.filter(note => {
    const tags = tag?.map(t => t.value)
    return (
      (titles === "" || note.title.toLowerCase().includes(titles.toLowerCase())) &&
      (tag.length === 0 || note.tag.includes(tags[0]))
    )
  }), [notes, titles, tag])

  const handleBack = () => {
    setTitle("Welcome")
    navigate("/")
  }
  
  return (
    <>
      {targetUser?.userName && notes && (<div className={`${color} bg-opacity-25 rounded pt-2 mb-3`}>
        <span className="mx-3 d-inline-flex align-items-center"><FaAddressCard className="fs-4"/>&ensp;{targetUser?.userName}</span>
        <span className="d-inline-flex align-items-center"><BsFillPersonFill className="fs-4"/>&ensp;{targetUser?.userRoles}</span>
      </div>)}

      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-primary mb-2" onClick={handleBack}><BiArrowBack /></button>
        <Link to="/note/add"><button className="btn btn-outline-primary mb-2"><BsPlusLg /></button></Link>
        {/* <Edit /> */}
      </div>

      <Stack className="mt-2 mb-3">
        <Row>
          <Col>
            <div className="input-group">
              <input type="search" className="form-control" placeholder="Search By Title..." value={titles} onChange={e => setTitles(e.target.value)}/>
              <button className="btn btn-outline-primary" type="button"><GoSearch/></button>
            </div>
          </Col>
          <Col>
            <CreatableReactSelect  
              // defaultValue={tagOption}
              isMulti
              value={tag}
              onChange={setTag}
              placeholder="Search By Tag..."
            />
          </Col>
        </Row>
      </Stack>
      
      <div className="row">
        {notes && <Details filteredNote={filteredNote}/>}
        {!filteredNote?.length && (titles || tag.length !== 0) && <div>No matching results found...</div>}
      </div>

      {notFound && !titles && !tag.length && !notes?.length && (<div>No Record Found...</div>)}
    </>
  )
}

export default Note