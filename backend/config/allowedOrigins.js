const url = require('./url')
const allowedOrigins = [url]
const paths = ['/api/auth/google', '/api/auth/google/callback']

module.exports = { allowedOrigins, paths }