// import { io } from 'socket.io-client'

// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL

// export const socket = io(SOCKET_URL, {
//   autoConnect: false,
//   withCredentials: true,
//   // transports: ['websocket'],
// }) 


import { io } from 'socket.io-client'

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  extraHeaders: {
    'ngrok-skip-browser-warning': '1'
  },
   transports: ['websocket'], // optional: uncomment if you want only websockets
})
