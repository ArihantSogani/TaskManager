import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { usePathContext } from '../../context/path'
import { useTasksContext } from '../../context/task'
import { useAuthContext } from '../../context/auth'
import { BiArrowBack } from 'react-icons/bi'
import { BsPlusLg } from 'react-icons/bs'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import { AiOutlineClose } from 'react-icons/ai'

const Add = () => {
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const { setTitle } = usePathContext()
  const { dispatch } =  useTasksContext()
  const { auth } = useAuthContext()
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [files, setFiles] = useState([])
  const [showFilesModal, setShowFilesModal] = useState(false)
  const fileInputRef = useRef(null)
  const titleRef = useRef('')
  const descriptionRef = useRef('')
  const priorityRef = useRef('Medium')
  const dueDateRef = useRef('')

  // Fetch all users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosPrivate.get('/api/users')
        setUsers(response.data)
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }
    
    if (show && auth?.roles?.includes('Admin')) {
      fetchUsers()
    }
  }, [show, auth, axiosPrivate])

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => {
      const allFiles = [...prev, ...newFiles];
      const uniqueFiles = [];
      const seen = new Set();
      for (const file of allFiles) {
        const key = file.name + file.size;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueFiles.push(file);
        }
      }
      return uniqueFiles;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleRemoveFile = (idx) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== idx);
      if (newFiles.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return newFiles;
    });
  }

  const handleAdd = async () => {
    if (!auth) {
      setError('You must be logged in')
      return
    }
    if (selectedUsers.length === 0) {
      setError('Please assign the task to at least one team member.')
      return
    }
   
    // Prepare form data for file upload
    const formData = new FormData()
    formData.append('title', titleRef.current.value)
    formData.append('description', descriptionRef.current.value)
    formData.append('priority', priorityRef.current.value)
    formData.append('dueDate', dueDateRef.current.value || '')
    selectedUsers.forEach(userId => formData.append('assignedTo', userId))
    files.forEach(file => formData.append('files', file))
    try {
      const response = await axiosPrivate.post('/api/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      dispatch({type: 'CREATE_TASK', payload: response.data})
      setError(null)
      setShow(false)
      setSelectedUsers([])
      setFiles([])
      // Clear form
      titleRef.current.value = ''
      descriptionRef.current.value = ''
      priorityRef.current.value = 'Medium'
      dueDateRef.current.value = ''
    } catch (error) {
      setError(error.response?.data.error)
    }
  }

  const handleBack = () => {
    setTitle("ComplyRelax")
    navigate("/")
  }

  return (
    <>
      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-primary mb-2" onClick={handleBack}><BiArrowBack /></button>
        <button className="btn btn-outline-primary mb-2" onClick={() => setShow(!show)}><BsPlusLg /></button>
      </div>

      <Modal show={show} onHide={() => {setShow(!show);setError(null)}} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>New Task</Modal.Title>
        </Modal.Header> 
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Title:</Form.Label>
            <Form.Control type="text" ref={titleRef}/>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description:</Form.Label>
            <Form.Control as="textarea" rows={3} ref={descriptionRef}/>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Priority:</Form.Label>
            <Form.Select ref={priorityRef}>
              <option value="">Select Priority of Task</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Due Date:</Form.Label>
            <Form.Control type="date" ref={dueDateRef}/>
          </Form.Group>
          {auth?.roles?.includes('Admin') && (
            <Form.Group className="mb-3">
              <Form.Label>Assign to Team Members:</Form.Label>
              <Form.Select multiple value={selectedUsers} onChange={e => {
                const options = Array.from(e.target.selectedOptions, option => option.value)
                setSelectedUsers(options)
              }} required>
                <option value="" disabled>Select team members</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Attach Files:</Form.Label>
            <Form.Control type="file" multiple accept=".png,.jpeg,.jpg,.pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/jpg,application/pdf" onChange={handleFileChange} ref={fileInputRef} />
            {files.length === 1 && (
              <div style={{marginTop: '10px'}}>{files[0].name}
                <button type="button" onClick={() => handleRemoveFile(0)} style={{marginLeft: '8px', border: 'none', background: 'transparent', color: 'red', cursor: 'pointer'}}>
                  <AiOutlineClose />
                </button>
              </div>
            )}
            {files.length > 1 && (
              <div style={{marginTop: '10px', color: 'blue', cursor: 'pointer'}} onClick={() => setShowFilesModal(true)}>
                {files.length} files attached
              </div>
            )}
            <Modal show={showFilesModal} onHide={() => setShowFilesModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Attached Files</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <ul style={{paddingLeft: 0}}>
                  {files.map((file, idx) => (
                    <li key={idx} style={{display: 'flex', alignItems: 'center', listStyle: 'none'}}>
                      <a
                        href={URL.createObjectURL(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{marginRight: '8px'}}
                        onClick={e => {
                          // Clean up the blob URL after opening
                          setTimeout(() => URL.revokeObjectURL(e.target.href), 10000)
                        }}
                      >
                        {file.name}
                      </a>
                      <button type="button" onClick={() => handleRemoveFile(idx)} style={{marginLeft: '8px', border: 'none', background: 'transparent', color: 'red', cursor: 'pointer'}}>
                        <AiOutlineClose />
                      </button>
                    </li>
                  ))}
                </ul>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowFilesModal(false)}>Close</Button>
              </Modal.Footer>
            </Modal>
          </Form.Group>
          {error && (<Alert variant={'danger'}>{error}</Alert>)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {setShow(!show);setError(null)}}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add Task</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Add