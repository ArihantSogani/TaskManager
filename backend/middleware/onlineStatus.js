const { User } = require('../models/sequelize');
const ROLES_LIST = require('../config/rolesList')
const { validateObjectId } = require('../utils/validation')

const setupSocket = (io) => {
  const userSessions = new Map()

  const updateUserStatus = async (userId, is_online) => {
    if (!validateObjectId(userId)) return new Error('Invalid user id')

    await User.update(
      { is_online, last_active: new Date() },
      { where: { id: userId } }
    )

    await updateUserLists()
  }

  const updateUserLists = async () => {
    const adminSession = userSessions.get('admin')
    const rootSession = userSessions.get('root')

    // console.log('Updating user lists - Admin session:', adminSession, 'Root session:', rootSession)

    if (adminSession) {
      const users = await getUsersForAdmin(adminSession.id)
      // console.log('Emitting adminUpdateUserList to admin:', adminSession.socketId, 'Users count:', users.length)
      io.to(adminSession.socketId).emit('adminUpdateUserList', users)
    }

    if (rootSession) {
      const users = await User.findAll({
        order: [['is_online', 'DESC'], ['last_active', 'DESC']]
      })
      // console.log('Emitting adminUpdateUserList to root:', rootSession.socketId, 'Users count:', users.length)
      io.to(rootSession.socketId).emit('adminUpdateUserList', users)
    }
  }

  const getUsersForAdmin = async (adminId) => {
    const query = {
      $or: [
        { roles: ROLES_LIST.User },
        { id: adminId }
      ],
      roles: { $ne: ROLES_LIST.Root }
    }
    return User.findAll(query)
  }

  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id)

    socket.on('online', async (userId) => {
      if (!validateObjectId(userId)) return new Error('Invalid user id')

      const user = await User.findByPk(userId, { attributes: ['id', 'roles'] })
      socket.userId = userId

      if (user.roles.includes(ROLES_LIST.Admin)) {
        console.log('Admin connected:', socket.id)
        userSessions.set('admin', { id: user.id, socketId: socket.id })
        socket.join(socket.id)
      }

      if (user.roles.includes(ROLES_LIST.Root)) {
        console.log('Root connected:', socket.id)
        userSessions.set('root', { id: user.id, socketId: socket.id })
        socket.join(socket.id)
      }

      await updateUserStatus(userId, true)
    })

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId)
      if (socket.userId) {
        // Remove user from sessions map
        const user = await User.findByPk(socket.userId, { attributes: ['id', 'roles'] })
        if (user) {
          if (user.roles.includes(ROLES_LIST.Admin)) {
            userSessions.delete('admin')
            console.log('Admin session removed from map')
          }
          if (user.roles.includes(ROLES_LIST.Root)) {
            userSessions.delete('root')
            console.log('Root session removed from map')
          }
        }
        await updateUserStatus(socket.userId, false)
      }
    })
  })
}

module.exports = setupSocket