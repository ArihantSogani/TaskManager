import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './context/auth'
import { usePathContext } from './context/path'
import { ROLES } from './config/roles'
import PersistLogin from './components/PersistLogin'
import RequireAuth from './components/RequireAuth'
import RequireRoles from './components/RequireRoles'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Navbar from './components/Navbar'
import Status from './components/Status'
import Add from './components/notes/Add'
import Edit from './components/notes/Edit'
import View from './components/notes/View'
import Home from './pages/Home'
import Note from './pages/Note'
import Task from './pages/Task'
import User from './pages/User'
import Assign from './pages/Assign'
import Error from './pages/error/Error'
import NotFound from './pages/error/NotFound'
import Notifications from './components/Notifications'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  const { auth } = useAuthContext()
  const { link } = usePathContext()

  return (
    <div className="App">
      <Navbar />
      <Status />
      <Notifications />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="container mt-3">
        <Routes>
          <Route element={<PersistLogin />}>
            <Route path="/" element={<Home />}/>
            <Route path="/login" element={!auth ? <Login /> : <Navigate to={link} />} />
            {/* <Route path="/signup" element={!auth ? <Signup /> : <Navigate to="/" />} /> */}

            <Route element={<RequireAuth />}>
              <Route element={<RequireRoles Roles={[...Object.values(ROLES)]} />}>
                <Route path="/task" element={<Task />} />
                <Route path="/note" element={<Note />} />
                <Route path="/note/view/:id" element={<View />} />
                <Route path="/note/add" element={<Add />} />
                <Route path="/note/edit/:id" element={<Edit />} />
              </Route>

              <Route element={<RequireRoles Roles={[ROLES.Root, ROLES.Admin]} />}>
                <Route path="/user" element={<User />} />
                <Route path="/assign" element={<Assign />} />
              </Route>
            </Route>
          </Route>
          <Route path="/error" element={<Error />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
}

export default App