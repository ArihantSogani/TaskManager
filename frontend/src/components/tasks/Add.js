import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { usePathContext } from '../../context/path'
import { useTasksContext } from '../../context/task'
import { useAuthContext } from '../../context/auth'
import { BiArrowBack } from 'react-icons/bi'
import { BsPlusLg } from 'react-icons/bs'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import { AiOutlineClose } from 'react-icons/ai'
import CreatableReactSelect from "react-select/creatable"
import Select from "react-select"

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
  const [labels, setLabels] = useState([])
  const [availableLabels, setAvailableLabels] = useState([])
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const titleRef = useRef('')
  const descriptionRef = useRef('')
  const priorityRef = useRef('Medium')
  const dueDateRef = useRef('')
  const [loading, setLoading] = useState(false)

  // Fetch all users for assignment and labels
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users if admin
        if (auth?.roles?.includes('Admin')) {
          const usersResponse = await axiosPrivate.get('/api/users')
          setUsers(usersResponse.data)
        }
        
        // Fetch available labels
        const labelsResponse = await axiosPrivate.get('/api/tasks/labels')
        console.log('Fetched labels:', labelsResponse.data)
        setAvailableLabels(labelsResponse.data)
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }
    
    if (show) {
      fetchData()
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

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
    setLoading(true)
    // Prepare form data for file upload
    const formData = new FormData()
    formData.append('title', titleRef.current.value)
    formData.append('description', descriptionRef.current.value)
    formData.append('priority', priorityRef.current.value)
    formData.append('dueDate', dueDateRef.current.value || '')
    selectedUsers.forEach(userId => formData.append('assignedTo', userId))
    files.forEach(file => formData.append('files', file))
    
    // Add labels to form data
    const labelValues = labels.map(l => l.value)
    formData.append('labels', JSON.stringify(labelValues))
    try {
      const response = await axiosPrivate.post('/api/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      dispatch({type: 'CREATE_TASK', payload: response.data})
      setError(null)
      setShow(false)
      setSelectedUsers([])
      setFiles([])
      setLabels([])
      // Clear form
      titleRef.current.value = ''
      descriptionRef.current.value = ''
      priorityRef.current.value = 'Medium'
      dueDateRef.current.value = ''
    } catch (error) {
      setError(error.response?.data.error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setTitle("ComplyRelax")
    navigate("/")
  }

  return (
    <>
      <button className="btn btn-outline-primary mb-2" onClick={() => setShow(!show)}><BsPlusLg /></button>

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
          <div className="row mb-3">
            <div className="col-6">
              <Form.Group>
                <Form.Label>Priority:</Form.Label>
                <Form.Select ref={priorityRef}>
                  <option value="">Select Priority of Task</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group>
                <Form.Label>Due Date:</Form.Label>
                <Form.Control
                  type="date"
                  ref={dueDateRef}
                  onFocus={e => {
                    if (e.target.showPicker) e.target.showPicker();
                  }}
                  onClick={e => {
                    if (e.target.showPicker) e.target.showPicker();
                  }}
                />
              </Form.Group>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-6">
              <Form.Group>
                <Form.Label>Labels:</Form.Label>
                <CreatableReactSelect 
                  isMulti 
                  value={labels}
                  onChange={setLabels}
                  options={availableLabels}
                  placeholder="Add Labels..."
                  noOptionsMessage={() => "Type to create new label..."}
                  formatCreateLabel={(inputValue) => `Create \"${inputValue}\"`}
                />
              </Form.Group>
            </div>
            {auth?.roles?.includes('Admin') && (
              <div className="col-6">
                <Form.Group>
                  <Form.Label>Assign to Team Members:</Form.Label>
                  <Select
                    isMulti
                    options={users.map(user => ({ value: user._id, label: user.name }))}
                    value={users.filter(user => selectedUsers.includes(user._id)).map(user => ({ value: user._id, label: user.name }))}
                    onChange={selected => setSelectedUsers(selected ? selected.map(opt => opt.value) : [])}
                    placeholder="Select team members..."
                    classNamePrefix="react-select"
                    required
                  />
                </Form.Group>
              </div>
            )}
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Attach Files:</Form.Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                border: dragActive ? '2px dashed #2563eb' : '2px dashed #ccc',
                borderRadius: 8,
                padding: 20,
                textAlign: 'center',
                background: dragActive ? '#e7f1ff' : '#fafbfc',
                marginBottom: 10,
                cursor: 'pointer',
                transition: 'background 0.2s, border 0.2s',
              }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {dragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select files'}
              <Form.Control
                type="file"
                multiple
                accept=".png,.jpeg,.jpg,.pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/jpg,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </div>
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
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Adding...
              </>
            ) : (
              'Add Task'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Add