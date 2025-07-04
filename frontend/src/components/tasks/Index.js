import { BsCalendarWeek } from 'react-icons/bs'
import { BiTimer } from 'react-icons/bi'
// import { ROLES } from '../../config/roles'
// import { useAuthContext } from '../../context/auth'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { isPast} from 'date-fns'
import Edit from './Edit'
import { AiOutlinePaperClip } from 'react-icons/ai'
import { useState } from 'react'

import TaskComments from './TaskComments'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { Modal, Button } from 'react-bootstrap'
import { AiOutlineInfoCircle } from 'react-icons/ai'

const Index = ({ tasks }) => {
  // const { auth } = useAuthContext()
  // const admin = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [modalFiles, setModalFiles] = useState([]);
  const [showActivity, setShowActivity] = useState({}); // key: task._id, value: boolean
  const handleShowFilesModal = (files) => {
    setModalFiles(files);
    setShowFilesModal(true);
  };
  const handleCloseFilesModal = () => {
    setShowFilesModal(false);
    setModalFiles([]);
  };
  return (
    <>
      {tasks.map(task => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        let borderColor = 'var(--gray)';
        if (task.status === 'Completed') {
          borderColor = 'var(--success)';
        } else if (task.dueDate) {
          // Overdue: due date is before today
          if (dueDateOnly < today) {
            borderColor = 'var(--danger)';
          // Due today
          } else if (dueDateOnly.getTime() === today.getTime()) {
            borderColor = 'var(--warning)';
          // Due this week (after today, before next Sunday)
          } else {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            if (dueDateOnly > today && dueDateOnly <= endOfWeek) {
              borderColor = 'var(--primary)';
            } else if (dueDateOnly > endOfWeek) {
              borderColor = '#bbb';
            }
          }
        }
        // Build a user lookup for activity display
        const users = {};
        if (task.createdBy) users[task.createdBy._id] = task.createdBy;
        if (task.assignedTo) task.assignedTo.forEach(u => users[u._id] = u);
        return (
          <div
            className="task-card mb-4"
            key={task._id}
            style={{
              boxShadow: 'var(--shadow)',
              border: `2px solid ${borderColor}`,
              borderRadius: 'var(--border-radius)',
              background: '#fff',
              overflow: 'hidden',
              padding: 0,
              marginBottom: 32
            }}
          >
            <div className="d-flex align-items-center justify-content-between px-4 pt-3 pb-2">
              <div className="d-flex align-items-center gap-3">
                <h4 className="mb-0" style={{fontWeight: 700, fontSize: '1.15em'}}>{task.title}</h4>
                <span className="badge rounded-pill" style={{background: task.priority === 'High' ? 'var(--danger)' : task.priority === 'Medium' ? 'var(--warning)' : '#17a2b8', color: '#fff', fontWeight: 600, fontSize: '0.85em', marginRight: 4}}>{task.priority}</span>
                <button className="btn btn-link p-0" style={{verticalAlign: 'middle'}} onClick={() => setShowActivity(prev => ({...prev, [task._id]: true}))} title="Task Activity"><AiOutlineInfoCircle size={22}/></button>
                <ActivityModal show={!!showActivity[task._id]} onHide={() => setShowActivity(prev => ({...prev, [task._id]: false}))} activity={task.activity || []} users={users} />
              </div>
              <div className="d-flex align-items-center gap-2">
                {task.status !== 'Completed' && (
                  <span className="badge rounded-pill" style={{background: task.status === 'On Hold' ? 'var(--warning)' : task.status === 'In Progress' ? 'var(--primary)' : '#6c757d', color: '#fff', fontWeight: 600, fontSize: '0.95em', minWidth: 110, justifyContent: 'center', display: 'inline-flex', alignItems: 'center'}}>{task.status}</span>
                )}
                {task.status === 'Completed' && (
                  <span className="badge rounded-pill" style={{background: 'var(--success)', color: '#fff', fontWeight: 600, fontSize: '0.95em', minWidth: 110, justifyContent: 'center', display: 'inline-flex', alignItems: 'center'}}><span style={{fontSize: '1.1em', marginRight: 4}}>✔</span>Completed</span>
                )}
                <span style={{marginLeft: 8}}><TaskComments task={task} /></span>
                <span style={{marginLeft: 8}}><EditButton task={task} /></span>
              </div>
            </div>
            <div className="px-4 pb-2" style={{color: '#555', fontSize: '1em'}}>{task.description}</div>
            <div className="px-4 pb-2" style={{fontSize: '1em'}}>
              {task.createdBy && (
                <span style={{fontSize: '1em', color: '#444'}}>
                  By : <span style={{fontWeight: 700}}>{task.createdBy.name}</span>
                  {task.assignedTo && task.assignedTo.length > 0 && (
                    <>
                      <span style={{margin: '0 6px'}}>to</span>
                      {task.assignedTo.map((user, idx) => (
                        <span key={user._id || idx} style={{background: '#e7f1ff', color: '#1976d2', borderRadius: 12, padding: '2px 10px', fontWeight: 600, fontSize: '0.97em', marginRight: 6, display: 'inline-block'}}>{user.name}</span>
                      ))}
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="d-flex align-items-center flex-wrap gap-4 px-4 pb-3" style={{fontSize: '0.97em', color: '#666', borderTop: '1px solid #eee', paddingTop: 10}}>
              {task.status === 'Completed' && task.completedAt ? (
                <span><BsCalendarWeek className="fs-6"/> <b>Completed On:</b> {new Date(task.completedAt).toLocaleDateString('en-GB')}</span>
                    ) : task.dueDate && (
                <span style={{color: isPast(new Date(task.dueDate)) ? 'var(--danger)' : undefined}}><BsCalendarWeek className="fs-6"/> <b>Due:</b> {new Date(task.dueDate).toLocaleDateString('en-GB')} {isPast(new Date(task.dueDate)) && <span style={{color:'var(--danger)', fontWeight:600}}>(Overdue!)</span>}</span>
                    )}
              <span><BiTimer className="fs-5"/> <b>Last updated:</b> {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</span>
                    {task.attachments && task.attachments.length > 0 && (
                <span><AiOutlinePaperClip />{' '}
                        {task.attachments.length === 1 ? (
                          <a
                            href={`http://localhost:4000/uploads/${task.attachments[0].filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                      style={{marginLeft: '5px', color: 'inherit', textDecoration: 'underline'}}>
                            {task.attachments[0].originalname}
                          </a>
                        ) : (
                          <span
                      style={{marginLeft: '5px', color: 'blue', cursor: 'pointer', textDecoration: 'underline'}}
                      onClick={() => handleShowFilesModal(task.attachments)}
                          >
                            {task.attachments.length} files attached
                          </span>
                        )}
                </span>
              )}
              <span><BsCalendarWeek className="fs-6"/> <b>Created:</b> {new Date(task.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="card-footer bg-white px-4 pt-2 pb-3 border-0 d-flex align-items-center gap-3">
              {/* ASSIGN button removed for all users */}
            </div>
          </div>
        );
      })}
      <Modal show={showFilesModal} onHide={handleCloseFilesModal} centered>
                          <Modal.Header closeButton>
                            <Modal.Title>Attached Files</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                              {modalFiles.map((file, idx) => (
            <div key={idx} style={{marginBottom: 8}}>
                                  <a
                                    href={`http://localhost:4000/uploads/${file.filename}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                style={{color: '#007bff', textDecoration: 'underline'}}
                                  >
                                    {file.originalname}
                                  </a>
            </div>
                              ))}
                          </Modal.Body>
                          <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseFilesModal}>
            Close
          </Button>
                          </Modal.Footer>
                        </Modal>
    </>
  )
}

// Three dots/settings button for opening Edit modal
function EditButton({ task }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button className="btn btn-link p-0" style={{verticalAlign: 'middle'}} onClick={() => setShow(true)} title="Task Settings">
        <BsThreeDotsVertical size={22}/>
      </button>
      {show && <EditModal task={task} show={show} setShow={setShow} />}
    </>
  );
}

// Modal wrapper for Edit
function EditModal({ task, show, setShow }) {
  return <Edit task={task} forceShow={show} setForceShow={setShow} />;
}

function ActivityModal({ show, onHide, activity, users }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Task Activity Timeline</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: 400, overflowY: 'auto' }}>
        {activity && activity.length > 0 ? (
          <ul className="list-unstyled">
            {activity.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((act, idx) => (
              <li key={idx} style={{ marginBottom: 16 }}>
                <div>
                  <b>{act.type === 'assigned' ? 'Assigned' : 'Status Change'}</b> &mdash; {new Date(act.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.97em', color: '#444' }}>
                  {act.type === 'assigned' && (
                    <>
                      <span>By: <b>{users[act.user]?.name || act.user}</b></span>
                      {act.to && <span> &rarr; <b>{users[act.to]?.name || act.to}</b></span>}
                    </>
                  )}
                  {act.type === 'status' && (
                    <>
                      <span>By: <b>{users[act.user]?.name || act.user}</b></span>
                      <span> &mdash; Status: <b>{act.status}</b></span>
                    </>
                  )}
                  {act.details && <div style={{ fontSize: '0.93em', color: '#888' }}>{act.details}</div>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted">No activity yet.</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default Index