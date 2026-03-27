const express = require('express')
const router = express.Router()
const redeemController = require('../../controllers/web/redeemController')
const { rateLimit } = require('../../middlewares/rateLimit')

const redeemLimiter = rateLimit({ windowMs: 60000, max: 5, message: '兑换操作过于频繁，请1分钟后再试' })

router.post('/use', redeemLimiter, redeemController.redeem)

module.exports = router
