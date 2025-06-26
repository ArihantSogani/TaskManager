import React from 'react'
import { FaSort, FaExclamationTriangle, FaClock, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa'

const TaskFilter = ({ filter, setFilter }) => {
  const filterOptions = [
    { value: 'all', label: 'All Tasks', icon: FaCalendarAlt },
    { value: 'overdue', label: 'Overdue', icon: FaExclamationTriangle, color: 'text-danger' },
    { value: 'urgent', label: 'Due Today', icon: FaClock, color: 'text-warning' },
    { value: 'upcoming', label: 'This Week', icon: FaCalendarAlt, color: 'text-info' },
    { value: 'future', label: 'Future', icon: FaCalendarAlt, color: 'text-success' },
    { value: 'completed', label: 'Completed', icon: FaCheckCircle, color: 'text-success' }
  ]

  return (
    <div className="task-filter mb-3">
      <div className="d-flex align-items-center gap-2">
        <FaSort className="text-muted" />
        <span className="text-muted me-2">Filter:</span>
        <div className="btn-group" role="group">
          {filterOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <button
                key={option.value}
                type="button"
                className={`btn btn-sm ${filter === option.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter(option.value)}
              >
                <IconComponent className={`me-1 ${option.color || ''}`} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TaskFilter 