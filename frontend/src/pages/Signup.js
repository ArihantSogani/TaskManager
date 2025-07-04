import { useRef, useState } from 'react'
import { useSignup } from '../hooks/useSignup'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { toast } from 'react-toastify'

const Signup = () => {
  const { signup, error, isLoading } = useSignup()
  const [ changeIcon, setChangeIcon ] = useState(false)
  const nameRef = useRef('')
  const emailRef = useRef('')
  const passwordRef = useRef('')
  const navigate = useNavigate()

  const handleBack = () => {
    
    navigate("/login")
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await signup(nameRef.current.value, emailRef.current.value.trim(), passwordRef.current.value.trim())
    if (result?.success) {
      toast.success(`Welcome ${result.name}! Redirecting to dashboard...`)
      handleBack();
    }
  }

  const handleShowPassword =  (e) => {
    e.preventDefault()
    const isPassword = passwordRef.current.type === "password"
    passwordRef.current.type = isPassword ? "text" : "password"
    setChangeIcon(isPassword)
  }

  return (
    <>
      <form className="signup" onSubmit={handleSubmit}>
        <h3 className="text-center mb-4">Sign Up</h3>
        
        <label>Username:</label>
        <input className="inputs" type="text" ref={nameRef} />

        <label>Email Address:</label>
        <input className="inputs" type="email" ref={emailRef}/>

        <label>Password:</label>
        <div className="d-flex">
          <input className="inputs" type="password" ref={passwordRef} autoComplete="off"/>
          <button className="btn mb-2" onClick={handleShowPassword}>{changeIcon ? <FaEyeSlash/> : <FaEye/>}</button>
        </div>
        <div style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '8px' }}>
          Password must be at least 8 characters and include at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol.
        </div>

        <button className="w-100 mt-3" disabled={isLoading}>Sign Up</button>

        {/* <div className="signup-prompt mt-3">Already have an account ? <Link to="/login">Login</Link></div> */}
        {error && 
          (<div className="error">{error}
            {error==="Password not strong enough" && 
              (<ul>
                <li>At least 8 character</li>
                <li>At least 1 lowercase</li>
                <li>At least 1 uppercase</li>
                <li>At least 1 numbers</li>
                <li>At least 1 symbols</li>
              </ul>)}
          </div>)}
      </form>
    </>
  )
}

export default Signup