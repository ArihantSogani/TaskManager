// import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROLES } from '../config/roles'
import { usePathContext } from '../context/path'
import { useAuthContext } from '../context/auth'
import { useUserContext } from '../context/user'
import { FaUserFriends, FaTasks, FaStickyNote } from 'react-icons/fa'
// import PushNotificationSetup from '../components/PushNotificationSetup'

const Home = () => {
    const { auth } = useAuthContext()
    const { setLink } = usePathContext()
    const { setTargetUser } = useUserContext()
    const accessRight = auth?.roles.includes(ROLES.Admin) || auth?.roles.includes(ROLES.Root)

    const handleClick = (title) => {
        setLink(title)
        setTargetUser()
    }

    return (
        <div className="home">
            <div className="container">
                {/* Push Notification Setup removed */}
                <div className="row">
                    {accessRight && (
                        <div className="col-md-6 col-lg-4 mb-4">
                            <Link to="/user" onClick={() => handleClick("Users")}>
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="icon"><FaUserFriends/></div>
                                            <div className="ms-3">
                                                <h5 className="card-title">Users</h5>
                                                <p className="card-text">Manage users</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}

                    <div className="col-md-6 col-lg-4 mb-4">
                        <Link to="/task" onClick={() => handleClick("Tasks")}>
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="icon"><FaTasks/></div>
                                        <div className="ms-3">
                                            <h5 className="card-title">Tasks</h5>
                                            <p className="card-text">Manage tasks</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="col-md-6 col-lg-4 mb-4">
                        <Link to="/note" onClick={() => handleClick("Notes")}>
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="icon"><FaStickyNote/></div>
                                        <div className="ms-3">
                                            <h5 className="card-title">Notes</h5>
                                            <p className="card-text">Manage notes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* <div className="col-md-6 col-lg-4 mb-4">
                        <Link to="/profile" onClick={() => handleClick("Profile")}>
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="icon"><FaUserCog/></div>
                                        <div className="ms-3">
                                            <h5 className="card-title">Profile</h5>
                                            <p className="card-text">Manage profile</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div> */}
                </div>
            </div>
        </div>
    )
}

export default Home