import React from 'react'
import { FaClock, FaExclamationTriangle, FaCheckCircle, FaCalendarAlt, FaListUl } from 'react-icons/fa'
import { getTaskCategory } from '../utils/taskDateCategory'

const TaskSummary = ({ tasks }) => {
  const now = new Date()
  
  const taskStats = tasks.reduce((stats, task) => {
    const cat = getTaskCategory(task, now);
    if (cat) stats[cat]++;
    if (task.status === 'Completed') stats.completed++;
    return stats;
  }, { overdue: 0, urgent: 0, upcoming: 0, future: 0, completed: 0 });

  const totalTasks = taskStats.overdue + taskStats.urgent + taskStats.upcoming + taskStats.future + taskStats.completed;

  return (
    <div className="task-summary mb-4">
      <h5 className="mb-3">
        <FaCalendarAlt className="me-2" />
        Task Overview
      </h5>
      <div className="row g-3">
        <div className="col-md-3 col-sm-6">
          <div className="card border-primary bg-primary bg-opacity-10">
            <div className="card-body text-center">
              <FaListUl className="fs-2 text-primary mb-2" />
              <h6 className="text-primary mb-1">Total Tasks</h6>
              <h4 className="text-primary mb-0">{totalTasks}</h4>
            </div>
          </div>
        </div>
        {taskStats.overdue > 0 && (
          <div className="col-md-3 col-sm-6">
            <div className="card border-danger bg-danger bg-opacity-10">
              <div className="card-body text-center">
                <FaExclamationTriangle className="fs-2 text-danger mb-2" />
                <h6 className="text-danger mb-1">Overdue</h6>
                <h4 className="text-danger mb-0">{taskStats.overdue}</h4>
              </div>
            </div>
          </div>
        )}
        
        {taskStats.urgent > 0 && (
          <div className="col-md-3 col-sm-6">
            <div className="card border-warning bg-warning bg-opacity-10">
              <div className="card-body text-center">
                <FaClock className="fs-2 text-warning mb-2" />
                <h6 className="text-warning mb-1">Due Today</h6>
                <h4 className="text-warning mb-0">{taskStats.urgent}</h4>
              </div>
            </div>
          </div>
        )}
        
        {taskStats.upcoming > 0 && (
          <div className="col-md-3 col-sm-6">
            <div className="card border-info bg-info bg-opacity-10">
              <div className="card-body text-center">
                <FaCalendarAlt className="fs-2 text-info mb-2" />
                <h6 className="text-info mb-1">This Week</h6>
                <h4 className="text-info mb-0">{taskStats.upcoming}</h4>
              </div>
            </div>
          </div>
        )}
        
        {taskStats.future > 0 && (
          <div className="col-md-3 col-sm-6">
            <div className="card border-secondary bg-secondary bg-opacity-10">
              <div className="card-body text-center">
                <FaCalendarAlt className="fs-2 text-secondary mb-2" />
                <h6 className="text-secondary mb-1">Future</h6>
                <h4 className="text-secondary mb-0">{taskStats.future}</h4>
              </div>
            </div>
          </div>
        )}
        
        {taskStats.completed > 0 && (
          <div className="col-md-3 col-sm-6">
            <div className="card border-success bg-success bg-opacity-10">
              <div className="card-body text-center">
                <FaCheckCircle className="fs-2 text-success mb-2" />
                <h6 className="text-success mb-1">Completed</h6>
                <h4 className="text-success mb-0">{taskStats.completed}</h4>
              </div>
            </div>
          </div>
        )}
        
        {/* {taskStats.noDueDate > 0 && (
          <div className="col-md-3 col-sm-6">
            <div className="card border-secondary bg-secondary bg-opacity-10">
              <div className="card-body text-center">
                <FaCalendarAlt className="fs-2 text-secondary mb-2" />
                <h6 className="text-secondary mb-1">No Due Date</h6>
                <h4 className="text-secondary mb-0">{taskStats.noDueDate}</h4>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}

export default TaskSummary 