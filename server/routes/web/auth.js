const express = require('express')
const router = express.Router()
const authController = require('../../controllers/web/authController')
const { rateLimit } = require('../../middlewares/rateLimit')

// 发送验证码：每个IP每分钟最多3次
const sendCodeLimit = rateLimit({ windowMs: 60000, max: 3, message: '发送验证码过于频繁，请1分钟后再试' })
// 注册：每个IP每小时最多5次
const registerLimit = rateLimit({ windowMs: 3600000, max: 5, message: '注册过于频繁，请稍后再试' })

router.post('/send-code', sendCodeLimit, authController.sendCode)
router.post('/login', authController.loginByPassword)
router.post('/login-code', authController.loginByCode)
router.post('/register', registerLimit, authController.register)
router.post('/reset-password', authController.resetPassword)

module.exports = router
