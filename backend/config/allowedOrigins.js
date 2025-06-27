// const url = require('./url')
// const allowedOrigins = [url]
// const paths = ['/api/auth/google', '/api/auth/google/callback']

// module.exports = { allowedOrigins, paths }

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.3:3000', // <-- add your local network IP if you use it
  // Add any other addresses you use
];
const paths = ['/api/auth/google', '/api/auth/google/callback'];

module.exports = { allowedOrigins, paths };