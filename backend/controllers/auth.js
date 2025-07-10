const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')
const validator = require('validator')
const url = require('../config/url')
const { User } = require('../models/sequelize')

const { CustomError } = require('../middleware/errorHandler')
const { validateAuthInputField } = require('../utils/validation')
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken')

exports.login = async (req, res, next) => {
  try {
    const { email, password, persist } = req.body
    
   
    const user = await User.login(email, password)

    // Update last_active date
    user.last_active = new Date();
    await user.save();

    const accessToken = generateAccessToken({
      userInfo: {
        id: user.id, 
        name: user.name, 
        email, 
        roles: user.roles
      }
    })
    
    if(persist){
      const refreshToken = generateRefreshToken(user.id)
      res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Lax', secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
    }

    res.status(200).json(accessToken)
  } catch (error) {
    next(error)
  }
}



exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, persist } = req.body

    validateAuthInputField({ name, email, password })
  
    const duplicateEmail = await User.findOne({ where: { email } })
    if (duplicateEmail) throw new CustomError('Email already in use', 409)
  
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.signup(name, email, hashedPassword)

    const accessToken = generateAccessToken({ 
      userInfo: {
        id: user.id, 
        name: user.name, 
        email: user.email, 
        roles: user.roles
      } 
    })

    if(persist){
      const refreshToken = generateRefreshToken(user.id)
      res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Lax', secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
    }

    res.status(200).json(accessToken)
  } catch (error) {
    next(error)
  }
}

exports.refresh = async (req, res, next) => {
  try {
    const cookies = req.cookies

    if (!cookies?.jwt) throw new CustomError('Unauthorized', 401)

    const refreshToken = cookies.jwt

    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new CustomError('Refresh token expired', 401)
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid refresh token', 401)
      } else {
        throw new CustomError('Token verification failed', 401)
      }
    }

    const user = await User.findByPk(decoded.id, { attributes: ['id', 'name', 'email', 'roles', 'active'] })
    if (!user) throw new CustomError('Unauthorized user not found', 401)

    if (!user.active) {
      res.clearCookie('jwt', { httpOnly: true, sameSite: 'Lax', secure: true })
      throw new CustomError('Your account has been blocked', 400)
    }

    const accessToken = generateAccessToken({
      userInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    })

    res.status(200).json(accessToken)
  } catch (error) {
    next(error)
  }
}

exports.logout = async (req, res, next) => {
  try {
    console.log('[LOGOUT] Cookies:', req.cookies);
    console.log('[LOGOUT] Headers:', req.headers);
    const cookies = req.cookies
    if (cookies?.jwt) {
      // Decode the JWT to get user ID
      let userId = null;
      try {
        const decoded = jwt.verify(cookies.jwt, process.env.REFRESH_TOKEN_SECRET);
        userId = decoded.id;
      } catch (e) {
        // ignore
      }
      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          user.is_online = false;
          await user.save();
          console.log(`[LOGOUT] Set is_online=false for user ${user.email} (${user.id})`);
        } else {
          console.log(`[LOGOUT] User not found for ID ${userId}`);
        }
      } else {
        console.log('[LOGOUT] No userId found in JWT');
      }
      res.clearCookie('jwt', { httpOnly: true, sameSite: 'Lax', secure: true })
    }
    res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}

