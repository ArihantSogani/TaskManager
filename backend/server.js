require('dotenv').config()
console.log('MySQL Database Configuration loaded')
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const { logger } = require('./middleware/logger')
const { errorHandler, notFound } = require('./middleware/errorHandler')
const { connectDB } = require('./config/mysqlConn')
const setupSocket = require('./middleware/onlineStatus')
const requireAuth = require('./middleware/requireAuth')
const notificationService = require('./services/notificationService')
const notificationRoutes = require('./routes/notification')

// Import Sequelize models
require('./models/sequelize/index')

const cors = require('cors');

const app = express()
app.set('trust proxy', 1) // Trust first proxy (Render, Heroku, etc.)
const server = http.createServer(app)

  app.use(cors({
    // origin: 'https://task-manager-mern-sooty.vercel.app',
    // origin: 'https://task-manager-mern-fpculo1to-arihant-soganis-projects.vercel.app/', // uncomment this for deploying it live
    // origin: 'https://60649481650f.ngrok-free.app',
    origin: process.env.CLIENT_URL,
    // origin: '*', or '*' for all origins (not recommended for production)
    credentials: true, // if you use cookies or authentication
  }));

// ✅ Initialize socket.io properly
const io = socketIo(server,{
  cors: {
    // origin:  'https://task-manager-mern-sooty.vercel.app',
    // origin: 'https://task-manager-mern-fpculo1to-arihant-soganis-projects.vercel.app/', // uncomment this for deploying it live
      // uncomment this for deploying it live
    // origin: 'https://60649481650f.ngrok-free.app',
    // origin: '*', Allow all origins for local development
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true, // Allow cookies to be sent with requests
  },
})
module.exports.io = io; // <-- export io instance
// ✅ Initialize DB
connectDB()

// ✅ Middleware
app.use(helmet())
// app.use(corsMiddleware)
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')))

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

//  Error Handling
app.use(notFound)
app.use(errorHandler)

//  Start Server
server.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`)
})
