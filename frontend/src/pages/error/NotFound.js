import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{height: '75vh'}}>
      <div className="text-center">
        <h1 className="display-1 fw-bold">404</h1>
        <p className="fs-3"> <span className="text-danger">Opps!</span> Page not found.</p>
        <p className="lead">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-secondary">Back To Home</Link>
      </div>
    </div>
  )
}

export default NotFound