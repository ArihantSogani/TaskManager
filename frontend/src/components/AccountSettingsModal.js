import { Modal, Button, Form, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useState } from 'react'
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useAuthContext } from '../context/auth'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import React from 'react'

const tabStyle = {
  display: 'flex',
  borderBottom: '1px solid #444',
  marginBottom: 0,
  marginTop: 8,
  paddingLeft: 8,
  background: 'transparent',
}
const tabItemStyle = isActive => ({
  color: isActive ? '#7b8cff' : '#ccc',
  fontWeight: isActive ? 600 : 400,
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: 16,
  marginRight: 24,
  padding: '0 0 8px 0',
  borderBottom: isActive ? '2px solid #7b8cff' : '2px solid transparent',
  cursor: 'pointer',
  transition: 'color 0.2s, border-bottom 0.2s',
})

const AccountSettingsModal = ({ show, onHide }) => {
  const [tab, setTab] = useState('profile')
  const { auth, dispatch } = useAuthContext()
  const axiosPrivate = useAxiosPrivate()
  const [name, setName] = useState(auth?.name || '')
  const [email, setEmail] = useState(auth?.email || '')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  React.useEffect(() => {
    if (show) {
      setName(auth?.name || '')
      setEmail(auth?.email || '')
      setError(null)
      // setSuccess(null) // Do not clear success here so the message remains visible
    }
  }, [show, auth])

  // Reset password fields when modal opens or tab changes
  React.useEffect(() => {
    if (show || tab === 'password') {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [show, tab]);

  // Remove auto-close on profile update success
  // (Keep the effect for password tab if you want, but remove for profile)
  // Remove or comment out the React.useEffect that closes the modal on success

  const handleProfileSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      // Only send changed fields
      const updateData = { id: auth.id }
      if (name !== auth.name) updateData.name = name
      if (email !== auth.email) updateData.email = email

      if (!updateData.name && !updateData.email) {
        setError('Nothing changed.')
        setLoading(false)
        return
      }

      const response = await axiosPrivate.patch('/api/users', updateData)
      if (response.data && Array.isArray(response.data)) {
        const updatedUser = response.data.find(u => u.id === auth.id)
        if (updatedUser) {
          dispatch({ type: 'LOGIN', payload: { ...auth, name: updatedUser.name, email: updatedUser.email } })
          localStorage.setItem('user', JSON.stringify({ ...auth, name: updatedUser.name, email: updatedUser.email }))
        }
      }
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      setPasswordLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      setPasswordLoading(false);
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      setPasswordLoading(false);
      return;
    }
    try {
      await axiosPrivate.patch('/api/users', {
        id: auth.id,
        password: newPassword,
        currentPassword: currentPassword
      });
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'New password doesn\'t match with current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="account-settings-modal-dark">
      <Modal.Header closeButton style={{ background: '#232b3b', borderBottom: 'none', color: '#fff' }}>
        <Modal.Title style={{ color: '#fff', fontWeight: 700, fontSize: 28 }}>Account Settings</Modal.Title>
      </Modal.Header>
      <div style={{ background: '#232b3b', padding: '0 0 24px 0' }}>
        <div style={tabStyle}>
          <button style={tabItemStyle(tab === 'profile')} onClick={() => setTab('profile')}>Profile</button>
          <button style={tabItemStyle(tab === 'password')} onClick={() => setTab('password')}>Password</button>
        </div>
      </div>
      <Modal.Body style={{ background: '#232b3b', color: '#fff', minHeight: 200 }}>
        {success && <Alert variant="success">{success}</Alert>}
        {tab === 'profile' && (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#fff' }}>Name</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaUser /></span>
                <Form.Control type="text" placeholder="Your UserName" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#fff' }}>Email Address</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaEnvelope /></span>
                <Form.Control type="email" placeholder="Your Gmail" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
          </Form>
        )}
        {tab === 'password' && (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#fff' }}>Current Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaLock /></span>
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="password-tooltip">
                      Password must have at least 8 characters, at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character
                    </Tooltip>
                  }
                >
                  <Form.Control
                    type={showCurrent ? "text" : "password"}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                  />
                </OverlayTrigger>
                <Button variant="default" className="mb-2" onClick={() => setShowCurrent(v => !v)} tabIndex={-1} style={{marginLeft: 4, color: '#fff', background: 'transparent', border: 'none'}}>
                  {showCurrent ? <FaEyeSlash/> : <FaEye/>}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#fff' }}>New Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaLock /></span>
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="password-tooltip">
                      Password must have at least 8 characters, at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character
                    </Tooltip>
                  }
                >
                  <Form.Control
                    type={showNew ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </OverlayTrigger>
                <Button variant="default" className="mb-2" onClick={() => setShowNew(v => !v)} tabIndex={-1} style={{marginLeft: 4, color: '#fff', background: 'transparent', border: 'none'}}>
                  {showNew ? <FaEyeSlash/> : <FaEye/>}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#fff' }}>Confirm New Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaLock /></span>
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="password-tooltip">
                      Password must have at least 8 characters, at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character
                    </Tooltip>
                  }
                >
                  <Form.Control
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </OverlayTrigger>
                <Button variant="default" className="mb-2" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} style={{marginLeft: 4, color: '#fff', background: 'transparent', border: 'none'}}>
                  {showConfirm ? <FaEyeSlash/> : <FaEye/>}
                </Button>
                {newPassword && confirmPassword && newPassword === confirmPassword && !passwordError && (
                  <span style={{ color: 'limegreen', marginLeft: 8, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    &nbsp;Password Matches
                  </span>
                )}
              </div>
            </Form.Group>
            {passwordError && <Alert variant="danger">{passwordError}</Alert>}
            {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer style={{ background: '#232b3b', borderTop: 'none' }}>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        {tab === 'profile' && <Button variant="primary" onClick={handleProfileSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>}
        {tab === 'password' && <Button variant="primary" onClick={handlePasswordChange} disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>{passwordLoading ? 'Saving...' : 'Save Changes'}</Button>}
      </Modal.Footer>
    </Modal>
  )
}

export default AccountSettingsModal 