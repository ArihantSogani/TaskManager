const router = require('express').Router()

const authController = require('../controllers/auth')
const loginLimiter = require('../middleware/loginLimiter')


router.post('/login', loginLimiter, authController.login)
router.post('/signup', authController.signup)
router.get('/refresh', authController.refresh)
router.post('/logout', authController.logout)


module.exports = router