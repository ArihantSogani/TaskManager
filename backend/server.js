require('dotenv').config()
console.log(' DATABASE_URL loaded as:', process.env.DATABASE_URL);
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const mongoose = require('mongoose')
const helmet = require("helmet")
const cookieParser = require('cookie-parser')
const corsMiddleware = require('./config/corsOptions')
const { logger } = require('./middleware/logger')
const { errorHandler, notFound } = require('./middleware/errorHandler')
const connectDB = require('./config/dbConn')
const setupSocket = require('./middleware/onlineStatus')
const requireAuth = require('./middleware/requireAuth')
const url = require('./config/url')
const notificationService = require('./services/notificationService')

const port = process.env.PORT || 4000
// console.log(`Server running in ${process.env.PORT} mode on port ${port}`);

const app = express()
const server = http.createServer(app)
const io = socketIo(server, { 
  cors: { 
    origin: url, 
    methods: ['GET', 'POST'],
    credentials: true
  } 
})

mongoose.set('strictQuery', false);
connectDB()

app.use(helmet())
app.use(corsMiddleware)

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', require('./routes/auth'))

app.use(requireAuth)

// Initialize socket.io services
notificationService.initializeSocket(io)
setupSocket(io)

// Socket.io connection handling
// io.on('connection', (socket) => {
//   const userId = socket.handshake.auth.userId
//   if (userId) {
//     socket.join(userId.toString())
//     console.log(`User ${userId} connected to notifications`)
//   }

//   socket.on('disconnect', () => {
//     if (userId) {
//       socket.leave(userId.toString())
//       console.log(`User ${userId} disconnected from notifications`)
//     }
//   })
// })

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, 'auth:', socket.handshake.auth);
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(userId.toString());
    console.log(`User ${userId} connected to notifications`);
  } else {
    console.log('No userId provided in socket handshake!');
  }

  socket.on('disconnect', () => {
    if (userId) {
      socket.leave(userId.toString());
      console.log(`User ${userId} disconnected from notifications`);
    }
  });
});

app.use('/api/users', require('./routes/user'))
app.use('/api/tasks', require('./routes/task'))
app.use('/api/notes', require('./routes/note'))
// app.use(logger)
app.use(notFound)
app.use(errorHandler)

mongoose.connection.once('open', () => {
  console.log('Database Connected Successfully!')
  server.listen(port, () => console.log(`Server running on port ${port}`))
})