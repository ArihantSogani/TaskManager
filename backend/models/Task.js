const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
    {
        assignedTo: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'User',
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'In Progress', 'Completed', 'On Hold'],
            default: "Pending"
        },
        priority: {
            type: String,
            required: true,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium'
        },
        dueDate: {
            type: Date
        },
        completedAt: {
            type: Date
     },
        notifications: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            message: {
                type: String,
                required: true
            },
            read: {
                type: Boolean,
                default: false
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        comments: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        attachments: [
            {
                filename: String,
                originalname: String,
                mimetype: String
            }
        ],
        labels: {
            type: [String],
            default: []
        },
        activity: [
            {
                type: { type: String, enum: ['assigned', 'status'], required: true },
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for assignment events
                status: { type: String }, // for status change events
                timestamp: { type: Date, default: Date.now },
                details: { type: String }
            }
        ]
    }, 
    {
        timestamps: true
    }
)

// Create notification for assigned users
taskSchema.methods.createAssignmentNotification = async function(assignedBy) {
    const notification = {
        message: `You have been assigned a new task: ${this.title}`,
        user: this.assignedTo
    }
    this.notifications.push(notification)
    await this.save()
    return notification
}

// Mark notification as read
taskSchema.methods.markNotificationAsRead = async function(userId, notificationId) {
    const notification = this.notifications.id(notificationId)
    if (notification && notification.user.toString() === userId.toString()) {
        notification.read = true
        await this.save()
        return true
    }
    return false
}

module.exports = mongoose.model('Task', taskSchema)