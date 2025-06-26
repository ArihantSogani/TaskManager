import { io } from 'socket.io-client'

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
}) 

// and on the admin page where we are printing the completed at date and time is should also reflect completed by : username