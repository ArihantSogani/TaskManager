import { useRef } from 'react'
import { useLogin } from '../hooks/useLogin'
// import { Link } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { Form, OverlayTrigger, Tooltip } from 'react-bootstrap'

const Login = () => {
  const { login, error, isLoading } = useLogin()
  const emailRef = useRef('')
  const passwordRef = useRef('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(emailRef.current.value.trim(), passwordRef.current.value.trim())
  }

  const handleShowPassword =  (e) => {
    e.preventDefault()
    const isPassword = passwordRef.current.type === "password"
    passwordRef.current.type = isPassword ? "text" : "password"
  }

  return (
    <>
      <form className="login" onSubmit={handleSubmit}>
        <h3 className="text-center mb-4">Log In</h3>

        <label>Email Address:</label>
        <input className="inputs" type="email" ref={emailRef}/>

        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <div className="d-flex">
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip id="password-tooltip">
                  PASSWORD must have at least 8 characters, at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character
                </Tooltip>
              }
            >
              <input className="inputs" type="password" ref={passwordRef} autoComplete="on"/>
            </OverlayTrigger>
            <button type="button" className="btn mb-2" onClick={handleShowPassword}>{passwordRef.current.type === "password" ? <FaEyeSlash/> : <FaEye/>}</button>
          </div>
          {/* <Form.Text className="text-muted">
            Password must have at least 8 characters, at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character
          </Form.Text> */}
        </Form.Group>

        <button className="w-100 mt-3" disabled={isLoading}>Log In</button>

        {/* <div className="signup-prompt mt-3">Create an account ? <Link to="/signup">Signup</Link></div> */}
        {error && <div className="error">{error}</div>}
      </form>
    </>
  )
}

export default Login