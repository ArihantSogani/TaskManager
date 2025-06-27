const notificationController = require('../controllers/notification');
let io;

const initializeSocket = (socketIo) => {
    io = socketIo;
    console.log('Notification service initialized with socket.io');
};

const sendNotification = async (userId, notification) => {
    if (!io) {
        console.error('Socket.io not initialized in notification service');
        throw new Error('Socket.io not initialized');
    }
    
    console.log('Emitting notification to user:', userId, 'with message:', notification.message);
    console.log('Available rooms:', Array.from(io.sockets.adapter.rooms.keys()));
    
    // Emit to specific user (in-app)
    io.to(userId.toString()).emit('notification', {
        type: 'TASK_ASSIGNED',
        data: notification
    });
    
    // Also emit to all connected clients for debugging
    io.emit('debug', {
        message: `Attempting to notify user ${userId} about: ${notification.message}`,
        userId: userId.toString(),
        rooms: Array.from(io.sockets.adapter.rooms.keys())
    });
    // Send web push notification
    await notificationController.sendToUser(userId, {
        title: 'Task Notification',
        body: notification.message,
        url: `/tasks/${notification.taskId || ''}`
    });
};

const sendTaskUpdate = async (userId, update) => {
    if (!io) {
        console.error('Socket.io not initialized in notification service');
        throw new Error('Socket.io not initialized');
    }

    console.log('Emitting task update to user:', userId, 'with message:', update.message);
    
    io.to(userId.toString()).emit('taskUpdate', {
        type: 'TASK_UPDATED',
        data: update
    });
    // Send web push notification
    await notificationController.sendToUser(userId, {
        title: 'Task Update',
        body: update.message,
        url: `/tasks/${update.taskId || ''}`
    });
};

const sendTaskComment = async (userIds, comment) => {
    if (!io) {
        console.error('Socket.io not initialized in notification service');
        throw new Error('Socket.io not initialized');
    }

    console.log('Emitting task comment to users:', userIds, 'with message:', comment.message);

    // Emit to all users involved in the task
    userIds.forEach(userId => {
        io.to(userId.toString()).emit('taskComment', {
            type: 'NEW_COMMENT',
            data: comment
        });
    });
    // Send web push notifications
    await Promise.all(userIds.map(userId =>
        notificationController.sendToUser(userId, {
            title: 'Task Comment',
            body: comment.message,
            url: `/tasks/${comment.taskId || ''}`
        })
    ));
};

module.exports = {
    initializeSocket,
    sendNotification,
    sendTaskUpdate,
    sendTaskComment
}; 