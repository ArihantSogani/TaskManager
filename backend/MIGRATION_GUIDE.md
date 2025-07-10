# MongoDB to MySQL Migration Guide

## Overview
This guide documents the migration from MongoDB (Mongoose) to MySQL (Sequelize) for the Task Manager application.

## Changes Made

### 1. Database Configuration
- **Old**: `config/dbConn.js` (MongoDB with Mongoose)
- **New**: `config/mysqlConn.js` (MySQL with Sequelize)

### 2. Models Structure
- **Old**: Mongoose schemas in `models/`
- **New**: Sequelize models in `models/sequelize/`

### 3. Model Changes

#### User Model
- **Old**: Nested password schema
- **New**: Flattened password fields (`password_hashed`, `password_error_count`, `password_error_date`)
- **Methods**: `signup()` and `login()` methods preserved

#### Task Model
- **Old**: Nested arrays for assignments, notifications, comments, activities
- **New**: Separate junction tables:
  - `TaskAssignment` (many-to-many relationship)
  - `TaskNotification` (one-to-many)
  - `TaskComment` (one-to-many)
  - `TaskActivity` (one-to-many)

#### Other Models
- `Label`, `Note`, `Notification`, `PushSubscription` converted to Sequelize

### 4. Database Schema Changes

#### Tables Created:
- `users` - User accounts
- `tasks` - Task information
- `task_assignments` - Many-to-many relationship between tasks and users
- `task_notifications` - Task-specific notifications
- `task_comments` - Task comments
- `task_activities` - Task activity logs
- `labels` - Task labels
- `notes` - User notes
- `notifications` - General notifications
- `push_subscriptions` - Push notification subscriptions

## Next Steps

### 1. Set Up MySQL Database
```sql
CREATE DATABASE task_manager;
CREATE USER 'task_manager_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON task_manager.* TO 'task_manager_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configure Environment Variables
Copy the template from `env-template.txt` to `.env` and update with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=task_manager
MYSQL_USER=task_manager_user
MYSQL_PASSWORD=your_password_here
```

### 3. Update Controllers
All controllers need to be updated to use Sequelize queries instead of Mongoose:

#### Example Changes:
```javascript
// Old (Mongoose)
const user = await User.findOne({ email }).exec();

// New (Sequelize)
const user = await User.findOne({ where: { email } });
```

#### Key Query Changes:
- `find()` → `findAll()`
- `findOne({ field })` → `findOne({ where: { field } })`
- `create()` → `create()` (same)
- `save()` → `save()` (same)
- `updateOne()` → `update()`
- `deleteOne()` → `destroy()`

### 4. Update Associations
For related data queries:
```javascript
// Old (Mongoose)
const task = await Task.findById(id).populate('assignedTo').exec();

// New (Sequelize)
const task = await Task.findByPk(id, {
  include: [
    { model: User, as: 'assignedUsers' },
    { model: User, as: 'creator' }
  ]
});
```

### 5. Handle Nested Data
For previously nested arrays, use separate queries:
```javascript
// Get task assignments
const assignments = await TaskAssignment.findAll({
  where: { task_id: taskId },
  include: [{ model: User, as: 'User' }]
});

// Get task comments
const comments = await TaskComment.findAll({
  where: { task_id: taskId },
  include: [{ model: User, as: 'User' }]
});
```

### 6. Update Authentication Middleware
Update `middleware/requireAuth.js` to work with Sequelize User model.

### 7. Test All Endpoints
Test each API endpoint to ensure it works with the new database structure.

## Migration Checklist

- [ ] Set up MySQL database
- [ ] Configure environment variables
- [ ] Update all controllers
- [ ] Update authentication middleware
- [ ] Update socket.io handlers (if needed)
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test task assignments
- [ ] Test notifications
- [ ] Remove old Mongoose dependencies

## Rollback Plan
If issues arise, you can:
1. Keep the old Mongoose models in `models/`
2. Switch back to `config/dbConn.js` in `server.js`
3. Revert controller changes

## Notes
- All timestamps are now in snake_case format (`created_at`, `updated_at`)
- Foreign keys use snake_case format
- JSON fields are used for arrays (labels, attachments)
- Many-to-many relationships use junction tables 