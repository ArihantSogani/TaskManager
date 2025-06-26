import { BsInfoCircleFill } from 'react-icons/bs'

const PersistLoginAlert = ({ maxWidth, marginAuto }) => {
  return (
    <div className="alert alert-info" role="alert" style={{maxWidth, margin: marginAuto ? "0 auto" : undefined}}>
        <div className="d-flex align-items-center mx-3">
          <BsInfoCircleFill/><div className="mx-2"><strong>Info:</strong></div>
        </div>
        <ul>
          <li>Choosing <strong>"Keep me logged in"</strong> reduces the number of the times you're asked Login on this device.</li>
          <li>To keep your account secure, use this option only on <strong>Trusted Devices</strong>.</li>
        </ul>
    </div>
  )
}

export default PersistLoginAlert