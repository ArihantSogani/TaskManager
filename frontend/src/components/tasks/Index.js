import { BsCalendarWeek } from 'react-icons/bs'
import { BiTimer } from 'react-icons/bi'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import Edit from './Edit'
import { AiOutlinePaperClip } from 'react-icons/ai'
import { useState, useEffect } from 'react'
import { Badge, Stack, Spinner } from "react-bootstrap"
import TaskComments from './TaskComments'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { Modal, Button } from 'react-bootstrap'
import { AiOutlineInfoCircle } from 'react-icons/ai'
import { getTaskCategory } from '../../utils/taskDateCategory'

const Index = ({ tasks, allUsers }) => {
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [modalFiles, setModalFiles] = useState([]);
  const [showActivity, setShowActivity] = useState({}); // key: task.id, value: boolean
  const handleShowFilesModal = (files) => {
    setModalFiles(files);
    setShowFilesModal(true);
  };
  const handleCloseFilesModal = () => {
    setShowFilesModal(false);
    setModalFiles([]);
  };
  // Build a global user lookup if allUsers is provided
  const globalUserMap = {};
  if (allUsers && Array.isArray(allUsers)) {
    allUsers.forEach(u => { if (u && u.id) globalUserMap[u.id] = u; });
  }

  console.log('[DEBUG] Global user map:', allUsers);
  return (
    <>
      {tasks.map(task => {
        // Build users object for activity modal from allUsers and task.activity
        // This does not change any previous functionality, only enhances username resolution in the modal
        const users = {};
        if (Array.isArray(task.activity) && allUsers && allUsers.length > 0) {
          const userIds = new Set();
          task.activity.forEach(act => {
            if (act.user) userIds.add(Number(act.user));
            if (act.to) userIds.add(Number(act.to));
          });
          allUsers.forEach(u => {
            if (userIds.has(Number(u.id))) {
              users[u.id] = { name: u.name };
            }
          });
        }
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const due_date = new Date(task.due_date);
        const dueDateOnly = new Date(due_date.getFullYear(), due_date.getMonth(), due_date.getDate());
        let borderColor = 'var(--gray)';
        if (task.status === 'Completed') {
          borderColor = 'var(--success)';
        } else if (task.due_date) {
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
        // Use backend-provided users object for activity modal
        console.log('[DEBUG] Task users:', task);
        const category = getTaskCategory(task);
        return (
          <div
            className="task-card mb-4"
            key={task.id}
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
                <button className="btn btn-link p-0" style={{verticalAlign: 'middle'}} onClick={() => setShowActivity(prev => ({...prev, [task.id]: true}))} title="Task Activity"><AiOutlineInfoCircle size={22}/></button>
                <ActivityModal show={!!showActivity[task.id]} onHide={() => setShowActivity(prev => ({...prev, [task.id]: false}))} activity={task.activity || []} users={users} />
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
            {task.labels && task.labels.length > 0 && (
              <div className="px-4 pb-2">
                <Stack gap={1} direction="horizontal" className="flex-wrap">
                  {task.labels.map((label, index) => (
                    <Badge key={index} className="text-truncate" style={{background: '#6c757d', color: '#fff'}}>{label.name || label}</Badge>
                  ))}
                </Stack>
              </div>
            )}
            <div className="px-4 pb-2" style={{fontSize: '1em'}}>
              {task.creator && (
                <span style={{fontSize: '1em', color: '#444'}}>
                  By : <span style={{fontWeight: 700}}>{task.creator.name}</span>
                  {task.assignedUsers && task.assignedUsers.length > 0 && (
                    <>
                      <span style={{margin: '0 6px'}}>to</span>
                      {task.assignedUsers.map((user, idx) => (
                        <span key={user.id || idx} style={{background: '#e7f1ff', color: '#1976d2', borderRadius: 12, padding: '2px 10px', fontWeight: 600, fontSize: '0.97em', marginRight: 6, display: 'inline-block'}}>{user.name}</span>
                      ))}
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="d-flex align-items-center flex-wrap gap-4 px-4 pb-3" style={{fontSize: '0.97em', color: '#666', borderTop: '1px solid #eee', paddingTop: 10}}>
              {task.status === 'Completed' && task.completed_at && !isNaN(new Date(task.completed_at)) ? (
                <span><BsCalendarWeek className="fs-6"/> <b>Completed On:</b> {new Date(task.completed_at).toLocaleDateString('en-GB')}</span>
              ) : task.due_date && !isNaN(new Date(task.due_date)) ? (
                <span>
                  <BsCalendarWeek className="fs-6"/> <b>Due:</b> {new Date(task.due_date).toLocaleDateString('en-GB')}
                  {category === 'overdue' && <span style={{color:'var(--danger)', fontWeight:600}}>(Overdue!)</span>}
                  {category === 'urgent' && <span style={{color:'var(--warning)', fontWeight:600}}>(Due Today)</span>}
                  {category === 'upcoming' && <span style={{color:'var(--info)', fontWeight:600}}>(This Week)</span>}
                  {category === 'future' && <span style={{color:'var(--secondary)', fontWeight:600}}>(Future)</span>}
                </span>
              ) : (
                <span><BsCalendarWeek className="fs-6"/> <b>Due:</b> N/A</span>
              )}
              <span><BiTimer className="fs-5"/> <b>Last updated:</b> {task.updated_at && !isNaN(new Date(task.updated_at)) ? formatDistanceToNow(new Date(task.updated_at), { addSuffix: true }) : 'N/A'}</span>
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
              <span><BsCalendarWeek className="fs-6"/> <b>Created:</b> {task.created_at && !isNaN(new Date(task.created_at)) ? new Date(task.created_at).toLocaleDateString('en-GB') : 'N/A'}</span>
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
  console.log('[EDITBUTTON TRACE 1] Rendered for task:', task.id);
  return (
    <>
      <button className="btn btn-link p-0" style={{verticalAlign: 'middle'}} onClick={() => {console.log('[EDITBUTTON TRACE 2] Button clicked for task:', task.id); setShow(true);}} title="Task Settings">
        <BsThreeDotsVertical size={22}/>
      </button>
      {show && (console.log('[EDITBUTTON TRACE 3] Showing EditModal for task:', task.id), <EditModal task={task} show={show} setShow={setShow} />)}
    </>
  );
}

// Modal wrapper for Edit
function EditModal({ task, show, setShow }) {
  return <Edit task={task} forceShow={show} setForceShow={setShow} />;
}

function ActivityModal({ show, onHide, activity, users }) {
  console.log('users object:', users);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (show) {
      setLoading(true);
      // Simulate async fetch or update delay
      const timer = setTimeout(() => setLoading(false), 600); // adjust as needed
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [show, activity]);

  // Debug logs
  useEffect(() => {
    if (show) {
      console.log('[DEBUG] ActivityModal users object:', users);
      if (Array.isArray(activity)) {
        activity.forEach((act, idx) => {
          const userName = users?.[act.user]?.name;
          console.log(`[DEBUG] Activity entry #${idx}:`, act, 'Resolved user name:', userName);
        });
      }
    }
  }, [show, users, activity]);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Task Activity Timeline</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 120 }}>
            <Spinner animation="border" role="status" />
          </div>
        ) : (
          activity && activity.length > 0 ? (
            <ul className="list-unstyled">
              {activity.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((act, idx) => {
                // Debug log for each activity entry and resolved user(s)
                console.log('[ACTIVITY ENTRY DEBUG]', {
                  idx,
                  act,
                  userObj: users[act.user],
                  toUserObj: act.to ? users[act.to] : undefined,
                  usersObj: users
                });
                return (
                  <li key={idx} style={{ marginBottom: 16 }}>
                    <div>
                      <b>{act.type === 'assigned' ? 'Assigned' : 'Changes Made'}</b> &mdash; {new Date(act.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                    <div style={{ fontSize: '0.97em', color: '#444' }}>
                      {act.type === 'assigned' && (
                        <>
                          <span>By: <b>{users[act.user]?.name || 'Unknown'}</b></span>
                          {act.to && <span> &rarr; <b>{users[act.to]?.name || 'Unknown'}</b></span>}
                        </>
                      )}
                      {act.type === 'status' && (
                        <>
                          <span>By: <b>{users[act.user]?.name || 'Unknown'}</b></span>
                          <span> &mdash; Status: <b>{act.status}</b></span>
                        </>
                      )}
                      {act.type === 'edit' && (
                        <>
                          <span>By: <b>{users[act.user]?.name || 'Unknown'}</b></span>
                          <span> &mdash; Field: <b>{act.field}</b></span>
                        </>
                      )}
                      {/* Show username instead of user ID in details for assigned */}
                      {act.type === 'assigned' && act.to && (
                        <div style={{ fontSize: '0.93em', color: '#888' }}>
                          Assigned to <b>{users[act.to]?.name || `user ID ${act.to}`}</b>
                        </div>
                      )}
                      {act.type !== 'assigned' && act.details && (
                        <div style={{ fontSize: '0.93em', color: '#888' }}>{act.details}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-muted">No activity yet.</div>
          )
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default Index