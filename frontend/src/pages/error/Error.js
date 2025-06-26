import { Link, useLocation } from 'react-router-dom'

const Error = () => {
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const message = queryParams.get('message')

  return (
    <div className="d-flex align-items-center justify-content-center" style={{height: '75vh'}}>
        <div className="text-center">
            <h1 className="display-1 fw-bold">403</h1>
            <p className="fs-3"> <span className="text-danger">Forbidden</span></p>
            {message && <p className="lead">{message}</p>}
            <Link to="/" className="btn btn-secondary">Back To Home</Link>
        </div>
    </div>
  )
}

export default Error