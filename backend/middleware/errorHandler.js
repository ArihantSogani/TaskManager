const { logEvents } = require('./logger')

class CustomError extends Error {
    constructor(message, statusCode, resetPasswordError) {
        super(message)
        this.statusCode  = statusCode 
        this.resetPasswordError = resetPasswordError
    }
}

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`)
    res.status(404)
    next(error)
}

const errorHandler = (err, req, res, next) => {
    
    const statusCode = err.statusCode || 500
    const message = err.message || 'Internal Server Error'
    const resetPasswordError = err.resetPasswordError || {}

    return res.status(statusCode).json({ 
        error: message, 
        ...resetPasswordError,
        stack: process.env.NODE_ENV === 'production' ? null :  err.stack 
    })
}
// module.exports = (err, req, res, next) => {
//   console.error('Global error handler:', err);
//   if (err && err.stack) {
//     console.error(err.stack);
//   }
//   res.status(err.status || 500).json({ error: err.message || 'Internal Server Error', stack: err.stack || null });
// };
module.exports = { CustomError, errorHandler, notFound } 