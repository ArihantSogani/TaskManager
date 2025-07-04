import { useLogout } from '../hooks/useLogout'
import { usePathContext } from '../context/path'
import { useAuthContext } from '../context/auth'
import { Nav, Navbar, Button, Dropdown, Badge } from "react-bootstrap"
import { FaHome, FaBell } from "react-icons/fa"
import { Link } from "react-router-dom"
import { useNotificationContext } from '../context/notification'
import { useState, useEffect } from 'react'


const Navbars = () => {
  const { logout } = useLogout()
  const { auth } = useAuthContext()
  const { title, setTitle } = usePathContext()
  const { notifications, unreadCount, markAllAsRead, loading } = useNotificationContext()
  const [showDropdown, setShowDropdown] = useState(false)


  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          
        })
      })
    }
  }, [])

  const handleToggle = (isOpen) => {
    setShowDropdown(isOpen)
    // Do not mark as read automatically; let user click the button
  }

  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <div className="container-fluid">
        <Navbar.Brand><h3><Link to="/" className="text-white" onClick={() => setTitle("ComplyRelax")}><FaHome/></Link>&ensp;{title}</h3></Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Navbar.Collapse className="justify-content-end">
            <Nav className="align-items-center">
              {auth && (
                <>
                  {/* Notification Bell */}
                  <Dropdown align="end" show={showDropdown} onToggle={handleToggle}>
                    <Dropdown.Toggle as="span" style={{ cursor: 'pointer', position: 'relative' }} id="notification-bell">
                      <FaBell className="fs-4 text-warning" />
                      {unreadCount > 0 && (
                        <Badge bg="danger" pill style={{ position: 'absolute', top: 0, right: 0, fontSize: '0.7rem' }}>{unreadCount}</Badge>
                      )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ minWidth: 320, maxWidth: 320, maxHeight: 400, overflowY: 'auto', overflowX: 'hidden' }}>
                      <Dropdown.Header className="d-flex justify-content-between align-items-center">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <Button size="sm" variant="outline-primary" onClick={markAllAsRead} disabled={loading}>
                            Mark all as read
                          </Button>
                        )}
                      </Dropdown.Header>
                      {notifications.length === 0 && (
                        <Dropdown.ItemText className="text-muted text-center">No notifications</Dropdown.ItemText>
                      )}
                      {notifications.map((n, idx) => (
                        <Dropdown.Item key={n._id || n.id || idx} className={!n.read ? 'fw-bold' : ''}>
                          <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                            {n.message}
                          </div>
                          <br/>
                          <small className="text-muted">{n.time || ''}</small>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Button variant="outline-warning" className="mx-3" onClick={() => logout()}>Log Out</Button>
                </>
              )}
              {!auth && (
                <>
                  <Nav.Link href="/login">Login</Nav.Link>
                  <Nav.Link href="/signup">Signup</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar.Collapse>
      </div>
    </Navbar>
  )
}

export default Navbars