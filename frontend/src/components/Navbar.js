import { useLogout } from '../hooks/useLogout'
import { usePathContext } from '../context/path'
import { useAuthContext } from '../context/auth'
import { Nav, Navbar, Button, Dropdown, Badge } from "react-bootstrap"
import { FaHome, FaBell } from "react-icons/fa"
import { Link } from "react-router-dom"
import { useNotificationContext } from '../context/notification'
import { useState, useEffect } from 'react'

// const VAPID_PUBLIC_KEY = 'BEC-44LjWQG3s6O8Ka6nZ00tAjnPn481oUXpQmFRyTGW7nhhuwTYtofADWCl8IZC3eQMGsY3l4W9M4WJmIauXZY'

//  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// function urlBase64ToUint8Array(base64String) {
//   const padding = '='.repeat((4 - base64String.length % 4) % 4)
//   const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
//   const rawData = window.atob(base64)
//   const outputArray = new Uint8Array(rawData.length)
//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i)
//   }
//   return outputArray
// }

const Navbars = () => {
  const { logout } = useLogout()
  const { auth } = useAuthContext()
  const { title, setTitle } = usePathContext()
  const { notifications, unreadCount, markAllAsRead } = useNotificationContext()
  const [showDropdown, setShowDropdown] = useState(false)
  // const [isSubscribed, setIsSubscribed] = useState(false)
  // const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          // setIsSubscribed(!!sub)
        })
      })
    }
  }, [])

  const handleToggle = (isOpen) => {
    setShowDropdown(isOpen)
    if (isOpen) markAllAsRead()
  }

  // const handleEnableNotification = async () => {
  //   setLoading(true)
  //   try {
  //     if (!('serviceWorker' in navigator)) return alert('Service Worker not supported')
  //     if (!('PushManager' in window)) return alert('Push not supported')
  //     const permission = await Notification.requestPermission()
  //     if (permission !== 'granted') return alert('Notification permission denied')
  //     const reg = await navigator.serviceWorker.register('/sw.js')
  //     const subscription = await reg.pushManager.subscribe({
  //       userVisibleOnly: true,
  //       applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  //     })
  //     await fetch('/api/notification/subscribe', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ userId: auth._id, subscription })
  //     })
  //     setIsSubscribed(true)
  //     alert('Push notifications enabled!')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

// const handleEnableNotification = async () => {
//   setLoading(true)
//   try {
//     if (!('serviceWorker' in navigator)) return alert('Service Worker not supported')
//     if (!('PushManager' in window)) return alert('Push not supported')
//     const permission = await Notification.requestPermission()
//     if (permission !== 'granted') return alert('Notification permission denied')
//     const reg = await navigator.serviceWorker.register('/sw.js')
//     const subscription = await reg.pushManager.subscribe({
//       userVisibleOnly: true,
//       applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
//     })
//     const plainSub = subscription.toJSON ? subscription.toJSON() : JSON.parse(JSON.stringify(subscription));
//     console.log('About to send subscription:', { userId: auth._id, subscription: plainSub })
//     const res = await fetch(`${API_URL}/api/notification/subscribe`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify({ userId: auth._id, subscription: plainSub })
//     })
//     if (!res.ok) {
//       const data = await res.json().catch(() => ({}))
//       throw new Error(data.message || 'Failed to enable notifications on server')
//     }
//     setIsSubscribed(true)
//     alert('Push notifications enabled!')
//   } catch (err) {
//     alert('Failed to enable notifications: ' + (err.message || err))
//     console.error('Enable notification error:', err)
//   } finally {
//     setLoading(false)
//   }
// }

// const handleDisableNotification = async () => {
//   setLoading(true)
//   try {
//     const reg = await navigator.serviceWorker.ready
//     const sub = await reg.pushManager.getSubscription()
//     if (sub) {
//       const endpoint = sub.endpoint
//       await sub.unsubscribe()
//       if (endpoint) {
//         // Call backend to remove subscription
//         const res = await fetch('/api/notification/unsubscribe', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ userId: auth._id, endpoint })
//         })
//         if (!res.ok) {
//           const data = await res.json().catch(() => ({}))
//           throw new Error(data.message || 'Failed to remove subscription on server')
//         }
//       }
//       setIsSubscribed(false)
//       alert('Push notifications disabled!')
//     } else {
//       alert('No active push subscription found.')
//     }
//   } catch (err) {
//     alert('Failed to disable notifications: ' + (err.message || err))
//     console.error('Disable notification error:', err)
//   } finally {
//     setLoading(false)
//   }
// }

  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <div className="container-fluid">
        <Navbar.Brand><h3><Link to="/" className="text-white" onClick={() => setTitle("Welcome")}><FaHome/></Link>&ensp;{title}</h3></Navbar.Brand>
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
                    <Dropdown.Menu style={{ minWidth: 320, maxHeight: 400, overflowY: 'auto' }}>
                      <Dropdown.Header>Notifications</Dropdown.Header>
                      {notifications.length === 0 && (
                        <Dropdown.ItemText className="text-muted text-center">No notifications</Dropdown.ItemText>
                      )}
                      {notifications.map((n, idx) => (
                        <Dropdown.Item key={n.id || idx} className={!n.read ? 'fw-bold' : ''}>
                          {n.message}
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