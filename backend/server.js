require('dotenv').config()
console.log('DATABASE_URL loaded as:', process.env.DATABASE_URL)

const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
// const corsMiddleware = require('./config/corsOptions')
const { logger } = require('./middleware/logger')
const { errorHandler, notFound } = require('./middleware/errorHandler')
const connectDB = require('./config/dbConn')
const setupSocket = require('./middleware/onlineStatus')
const requireAuth = require('./middleware/requireAuth')
const notificationService = require('./services/notificationService')
const notificationRoutes = require('./routes/notification')

const cors = require('cors');

const app = express()
const server = http.createServer(app)

  app.use(cors({
    origin: ['https://task-manager-mern-sooty.vercel.app/'], // Replace with your client URL
    // origin: 'http://localhost:3000/', // or '*' for all origins (not recommended for production)
    credentials: true, // if you use cookies or authentication
  }));

// ✅ Initialize socket.io properly
const io = socketIo(server,{
  cors: {
    origin: [ 'https://task-manager-mern-sooty.vercel.app/'], // Replace with your client URL
    methods: ['GET', 'POST'],
    credentials: true, // Allow cookies to be sent with requests
  },
})
// ✅ Initialize DB
mongoose.set('strictQuery', false)
connectDB()

// ✅ Middleware
app.use(helmet())
// app.use(corsMiddleware)
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())

// ✅ Routes (no auth needed)
app.use('/api/auth', require('./routes/auth'))

// ✅ Authenticated Routes
app.use(requireAuth)
app.use('/api/users', require('./routes/user'))
app.use('/api/tasks', require('./routes/task'))
app.use('/api/notes', require('./routes/note'))
app.use('/api/notification', notificationRoutes)

// ✅ Socket Setup
notificationService.initializeSocket(io)
setupSocket(io)

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId

  console.log('Socket connected:', socket.id, 'user:', userId)

  if (userId) {
    socket.join(userId.toString())
    console.log(`User ${userId} joined room ${userId}`)
  } else {
    console.log('No userId provided in socket handshake!')
  }

  // ✅ Handle Task Assignment Notification
  socket.on('taskAssigned', ({ sender, message, assignedTo }) => {
    console.log(`Task assigned by ${sender} to ${assignedTo.join(', ')}: ${message}`)
    assignedTo.forEach(userId => {
      io.to(userId.toString()).emit('new-message', {
        sender,
        message,
      })
    })
  })

  socket.on('disconnect', () => {
    if (userId) {
      console.log(`User ${userId} disconnected`)
      socket.leave(userId.toString())
    }
  })
})

// ✅ Error Handling
app.use(notFound)
app.use(errorHandler)

// ✅ Start Server
mongoose.connection.once('open', () => {
  console.log('Database Connected Successfully!')
  server.listen(process.env.PORT || 4000, () => {
    console.log(`Server running on port ${process.env.PORT || 4000}`)
  })
})
