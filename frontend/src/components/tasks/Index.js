import { AiOutlineUsergroupAdd } from "react-icons/ai"
import { BsCalendarWeek } from 'react-icons/bs'
import { BiTimer } from 'react-icons/bi'
// import { FiMoreHorizontal } from "react-icons/fi"
import { HiOutlineStar } from "react-icons/hi"
import { MdAdminPanelSettings } from "react-icons/md"
import { SiStatuspal } from "react-icons/si"
import { Link } from 'react-router-dom'
import { ROLES } from '../../config/roles'
import { useAuthContext } from '../../context/auth'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { format, isPast } from 'date-fns'
import Delete from './Delete'
import Edit from './Edit'

const Index = ({ tasks }) => {
  const { auth } = useAuthContext()
  const admin = auth.roles.includes(ROLES.Admin) || auth.roles.includes(ROLES.Root)

  const getRemainingTime = (dueDate) => {
    if (!dueDate) return null
    // const now = new Date()
    const due = new Date(dueDate)
    if (isPast(due)) {
      return "Overdue!"
    }
    return formatDistanceToNow(due, { addSuffix: true })
  }

  return (
    <>
      {tasks.map(task => (
        <div className="card mb-3" key={task._id}>
          <div className="card-body">
            <div className="row">
              <div className="col-12 mb-2">
                <h4 className="card-title"><b>{task.title}</b></h4>
              </div>
              <div className="col">
                <h6 className="card-subtitle mb-2 text-muted">
                  <p className="card-text text-muted small">
                    <HiOutlineStar className="mr-1 fs-5"/>
                    <span className="vl"></span>
                    <MdAdminPanelSettings className="fs-4"/><span className="font-weight-bold">&nbsp;{task.createdBy.name}</span>
                    <span className="vl"></span>
                    <SiStatuspal className="fs-6"/><small>&ensp;{task.status}</small>
                    <span className="vl"></span>
                    <BsCalendarWeek className="fs-6"/><small>&ensp;Created: {new Date(task.createdAt).toLocaleDateString('en-GB')}</small>
                    <span className="vl"></span>
                    {task.status === 'Completed' ? (
                      <>
                        <BsCalendarWeek className="fs-6"/>
                        <small>&ensp;Completed: {format(new Date(task.updatedAt), 'dd/MM/yyyy HH:mm')}</small>
                      </>
                    ) : task.dueDate && (
                      <>
                        <BsCalendarWeek className="fs-6"/>
                        <small style={{ color: isPast(new Date(task.dueDate)) ? 'red' : 'inherit' }}>
                          &ensp;Due: {format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm')}
                        </small>
                        <span className="vl"></span>
                        <BiTimer className="fs-5"/>
                        <small style={{ color: isPast(new Date(task.dueDate)) ? 'red' : 'inherit' }}>
                          &ensp;{getRemainingTime(task.dueDate)}
                        </small>
                      </>
                    )}
                    {task.status !== 'Completed' && (
                      <>
                        <span className="vl"></span>
                        <BiTimer className="fs-5"/>
                        <small>&ensp;Last updated: {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</small>
                      </>
                    )}
                  </p>
                </h6>
              </div>
            </div>
            <div className="col">
              <p className="card-text">{task.description}</p>
            </div>
          </div>
          <div className="card-footer bg-white px-0">
            <div className="row">
              <div className="col-md-auto">
                {admin && (
                  <>
                    <Link className="btn btn-outlined text-muted taskbtn" to="/assign" state={{id: task._id, title: task.title, createdBy: task.createdBy}}>
                      <AiOutlineUsergroupAdd className="fs-4"/>
                      <small>&ensp;ASSIGN</small>
                    </Link>
                    <Delete task={task}/>
                  </>
                )}
                <Edit task={task}/>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default Index