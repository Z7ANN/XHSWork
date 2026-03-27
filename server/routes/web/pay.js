const express = require('express')
const router = express.Router()
const { success, error, ErrorCode } = require('../../utils/response')
const { verifyWechatNotify, verifyAlipayNotify, getEnabledPayMethods } = require('../../services/payService')
const { handlePayNotify } = require('../../services/orderService')
const configRepository = require('../../repositories/configRepository')

// 公开接口：获取支付方式开关
router.get('/methods', async (req, res) => {
  try {
    const methods = await getEnabledPayMethods()
    return success(res, methods)
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
})

// 公开接口：获取二维码配置
router.get('/qrcodes', async (req, res) => {
  try {
    const [wechat, contact] = await Promise.all([
      configRepository.findByKey('qr_wechat'),
      configRepository.findByKey('qr_contact'),
    ])
    return success(res, {
      wechat: wechat?.configValue || '',
      contact: contact?.configValue || '',
    })
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
})

// 微信支付回调（不需要auth）
router.post('/wechat/notify', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const result = await verifyWechatNotify(req.headers, req.body)
    if (result) {
      await handlePayNotify(result.orderNo, result.tradeNo)
    }
    res.json({ code: 'SUCCESS', message: '成功' })
  } catch (err) {
    console.error('[微信回调错误]', err.message)
    res.status(500).json({ code: 'FAIL', message: err.message })
  }
})

// 支付宝回调（不需要auth）
router.post('/alipay/notify', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const result = await verifyAlipayNotify(req.body)
    if (result) {
      await handlePayNotify(result.orderNo, result.tradeNo)
    }
    res.send('success')
  } catch (err) {
    console.error('[支付宝回调错误]', err.message)
    res.send('fail')
  }
})

module.exports = router
