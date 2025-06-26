const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')
const validator = require('validator')
const url = require('../config/url')
const User = require('../models/user/User')

const { CustomError } = require('../middleware/errorHandler')
const { validateAuthInputField } = require('../utils/validation')
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken')



exports.login = async (req, res, next) => {
  try {
    const { email, password, persist } = req.body
    
   
    const user = await User.login(email, password)

    const accessToken = generateAccessToken({
      userInfo: {
        _id: user._id, 
        name: user.name, 
        email, 
        roles: user.roles
      }
    })
    
    if(persist){
      const refreshToken = generateRefreshToken(user._id)
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
  
    const duplicateEmail = await User.findOne({ email }).collation({ locale: 'en', strength: 2 }).lean().exec()
    if (duplicateEmail) throw new CustomError('Email already in use', 409)
  
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.signup(name, email, hashedPassword)

    const accessToken = generateAccessToken({ 
      userInfo: {
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        roles: user.roles
      } 
    })

    if(persist){
      const refreshToken = generateRefreshToken(user._id)
      res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Lax', secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
    }

    res.status(200).json(accessToken)
  } catch (error) {
    next(error)
  }
}

