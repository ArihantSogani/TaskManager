import React from 'react'

const PersistLoginCheckbox = ({ persist, setPersist, className, bold }) => {
  return (
    <div className={`form-check ${className}`}>
      <label htmlFor="persist" className="form-check-label">
        <input id="persist" className="form-check-input" type="checkbox" onChange={() => { setPersist(prev => !prev) }} checked={persist}/>
        {bold ? <strong>Keep me logged in</strong> : 'Keep me logged in'}
      </label>
    </div>
  )
}

export default PersistLoginCheckbox