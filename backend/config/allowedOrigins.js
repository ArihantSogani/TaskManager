// const url = require('./url')
// const allowedOrigins = [url]
// const paths = ['/api/auth/google', '/api/auth/google/callback']

// module.exports = { allowedOrigins, paths }

const allowedOrigins = [
  'http://localhost:3000', // React dev server
  // Add your deployed frontend URL here if needed, e.g.:
  // 'https://your-frontend-domain.com'
];
const paths = ['/api/auth/google', '/api/auth/google/callback'];

module.exports = { allowedOrigins, paths };