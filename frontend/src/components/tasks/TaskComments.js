import { useEffect, useState, useRef } from 'react';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
// import { useAuthContext } from '../../context/auth';
import { socket } from '../../socket';
import { Modal, Button } from 'react-bootstrap';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

const TaskComments = ({ task }) => {
  const axiosPrivate = useAxiosPrivate();
  // const { auth } = useAuthContext();
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const inputRef = useRef();

  useEffect(() => {
    setComments(task.comments || []);
    setUnreadCount(0); // Reset unread count on mount
  }, [task.comments]);

  useEffect(() => {
    // Listen for real-time comment updates via socket
    const handleNewComment = (data) => {
      if (data.taskId === task._id) {
        setComments((prev) => [...prev, data.comment]);
        if (!show) setUnreadCount((prev) => prev + 1);
      }
    };
    socket.on('task-comment', handleNewComment);
    return () => socket.off('task-comment', handleNewComment);
  }, [task._id, show]);

  // Reset unread count when modal is opened
  useEffect(() => {
    if (show) setUnreadCount(0);
  }, [show]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosPrivate.post(`/api/tasks/${task._id}/comments`, { text: newComment });
      setComments(response.data.comments || []);
      setNewComment('');
      inputRef.current && inputRef.current.focus();
      // Emit socket event for real-time update
      socket.emit('task-comment', {
        taskId: task._id,
        comment: response.data.comments[response.data.comments.length - 1],
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Button variant="outline-secondary" size="sm" style={{marginLeft: 8}} onClick={() => setShow(true)}>
          Comments ({comments.length})
        </Button>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            fontSize: '0.75em',
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            zIndex: 2
          }}>{unreadCount}</span>
        )}
      </div>
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{maxHeight: 300, overflowY: 'auto', padding: 12}}>
          {comments.length === 0 && <div className="text-muted">No comments yet.</div>}
          {comments.map((c, idx) => (
            <div key={idx} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 500, fontSize: '0.97em', wordBreak: 'break-word', whiteSpace: 'pre-line', maxWidth: '70%' }}>
                {(c.user && (c.user.name || c.user.username || c.user.email)) || 'User'}: <span style={{ fontWeight: 400 }}>{c.text}</span>
              </div>
              <div style={{ color: '#aaa', fontSize: '0.85em', marginLeft: 8, whiteSpace: 'nowrap' }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
          <form className="d-flex w-100" onSubmit={handleAddComment} style={{ gap: 4 }}>
            <input
              ref={inputRef}
              type="text"
              className="form-control form-control-sm"
              style={{ fontSize: '0.95em', borderRadius: 3, border: '1px solid #ccc' }}
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              disabled={loading}
            />
            <Button variant="primary" size="sm" type="submit" disabled={loading || !newComment.trim()} style={{ fontSize: '0.95em', borderRadius: 3 }}>
              {loading ? '...' : 'Add'}
            </Button>
          </form>
          {error && <div className="text-danger mt-1" style={{ fontSize: '0.93em' }}>{error}</div>}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TaskComments; 