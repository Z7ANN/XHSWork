const crypto = require('crypto')
const https = require('https')
const configRepository = require('../repositories/configRepository')
const { createError, ErrorCode } = require('../utils/response')

async function getConfig(key) {
  const row = await configRepository.findByKey(key)
  return row ? row.configValue : null
}

async function getWechatConfig() {
  const [appid, mchid, apiKey, notifyUrl] = await Promise.all([
    getConfig('pay_wechat_appid'),
    getConfig('pay_wechat_mchid'),
    getConfig('pay_wechat_api_key'),
    getConfig('pay_wechat_notify_url'),
  ])
  if (!appid || !mchid || !apiKey || !notifyUrl) {
    throw createError('微信支付配置不完整', ErrorCode.PAYMENT_ERROR)
  }
  return { appid, mchid, apiKey, notifyUrl }
}

async function getAlipayConfig() {
  const [appid, privateKey, publicKey, notifyUrl] = await Promise.all([
    getConfig('pay_alipay_appid'),
    getConfig('pay_alipay_private_key'),
    getConfig('pay_alipay_public_key'),
    getConfig('pay_alipay_notify_url'),
  ])
  if (!appid || !privateKey || !publicKey || !notifyUrl) {
    throw createError('支付宝配置不完整', ErrorCode.PAYMENT_ERROR)
  }
  return { appid, privateKey, publicKey, notifyUrl }
}

function buildWechatSign(method, url, timestamp, nonceStr, body, apiKey) {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`
  return crypto.createHmac('sha256', apiKey).update(message).digest('hex')
}

function httpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ statusCode: res.statusCode, data })
        }
      })
    })
    req.on('error', reject)
    if (postData) req.write(postData)
    req.end()
  })
}

async function createWechatPay(orderNo, amount, description) {
  const { appid, mchid, apiKey, notifyUrl } = await getWechatConfig()

  const amountInFen = Math.round(parseFloat(amount) * 100)
  const body = JSON.stringify({
    appid,
    mchid,
    description,
    out_trade_no: orderNo,
    notify_url: notifyUrl,
    amount: { total: amountInFen, currency: 'CNY' },
  })

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonceStr = crypto.randomBytes(16).toString('hex')
  const urlPath = '/v3/pay/transactions/native'
  const signature = buildWechatSign('POST', urlPath, timestamp, nonceStr, body, apiKey)

  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`

  const res = await httpsRequest({
    hostname: 'api.mch.weixin.qq.com',
    path: urlPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authorization,
      'User-Agent': 'NodePayService/1.0',
    },
  }, body)

  if (res.statusCode !== 200 || !res.data.code_url) {
    const msg = res.data?.message || '微信支付下单失败'
    throw createError(msg, ErrorCode.PAYMENT_ERROR)
  }

  return res.data.code_url
}

async function createAlipayPay(orderNo, amount, description) {
  const { appid, privateKey, publicKey, notifyUrl } = await getAlipayConfig()

  const { AlipaySdk } = require('alipay-sdk')
  const alipaySdk = new AlipaySdk({
    appId: appid,
    privateKey,
    alipayPublicKey: publicKey,
  })

  const result = await alipaySdk.exec('alipay.trade.precreate', {
    notifyUrl,
    bizContent: {
      out_trade_no: orderNo,
      total_amount: parseFloat(amount).toFixed(2),
      subject: description,
    },
  })

  const qrCode = result.qrCode || result.qr_code
  if (!qrCode) {
    const msg = result.subMsg || result.msg || '支付宝下单失败'
    throw createError(msg, ErrorCode.PAYMENT_ERROR)
  }

  return qrCode
}

function decryptWechatResource(resource, apiKey) {
  const { algorithm, ciphertext, associated_data, nonce } = resource
  if (algorithm !== 'AEAD_AES_256_GCM') {
    throw createError('不支持的加密算法', ErrorCode.PAYMENT_ERROR)
  }
  const key = Buffer.from(apiKey, 'utf8')
  const iv = Buffer.from(nonce, 'utf8')
  const cipherBuffer = Buffer.from(ciphertext, 'base64')
  const authTag = cipherBuffer.subarray(cipherBuffer.length - 16)
  const data = cipherBuffer.subarray(0, cipherBuffer.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  if (associated_data) decipher.setAAD(Buffer.from(associated_data, 'utf8'))
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}

async function verifyWechatNotify(headers, body) {
  const timestamp = headers['wechatpay-timestamp']
  const nonce = headers['wechatpay-nonce']
  const signature = headers['wechatpay-signature']

  if (!timestamp || !nonce || !signature) {
    throw createError('微信回调验签参数缺失', ErrorCode.PAYMENT_ERROR)
  }

  const bodyStr = typeof body === 'string' ? body : body.toString('utf8')
  const parsed = JSON.parse(bodyStr)

  if (parsed.event_type !== 'TRANSACTION.SUCCESS') return null

  const { apiKey } = await getWechatConfig()
  const decrypted = decryptWechatResource(parsed.resource, apiKey)

  return {
    orderNo: decrypted.out_trade_no,
    tradeNo: decrypted.transaction_id,
    amount: decrypted.amount?.total,
  }
}

async function verifyAlipayNotify(params) {
  if (params.trade_status !== 'TRADE_SUCCESS' && params.trade_status !== 'TRADE_FINISHED') {
    return null
  }

  const { appid, privateKey, publicKey } = await getAlipayConfig()
  const { AlipaySdk } = require('alipay-sdk')
  const alipaySdk = new AlipaySdk({
    appId: appid,
    privateKey,
    alipayPublicKey: publicKey,
  })

  const verified = alipaySdk.checkNotifySign(params)
  if (!verified) {
    throw createError('支付宝回调验签失败', ErrorCode.PAYMENT_ERROR)
  }

  return {
    orderNo: params.out_trade_no,
    tradeNo: params.trade_no,
    amount: params.total_amount,
  }
}

async function getEnabledPayMethods() {
  const [wechatEnabled, alipayEnabled] = await Promise.all([
    getConfig('pay_wechat_enabled'),
    getConfig('pay_alipay_enabled'),
  ])
  return {
    wechat: wechatEnabled === '1',
    alipay: alipayEnabled === '1',
  }
}

async function queryWechatPayStatus(orderNo) {
  const { mchid, apiKey } = await getWechatConfig()
  const urlPath = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${mchid}`
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonceStr = crypto.randomBytes(16).toString('hex')
  const signature = buildWechatSign('GET', urlPath, timestamp, nonceStr, '', apiKey)
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`

  const res = await httpsRequest({
    hostname: 'api.mch.weixin.qq.com',
    path: urlPath,
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Authorization': authorization, 'User-Agent': 'NodePayService/1.0' },
  })

  if (res.statusCode === 200 && res.data.trade_state === 'SUCCESS') {
    return { paid: true, tradeNo: res.data.transaction_id }
  }
  return { paid: false }
}

async function queryAlipayPayStatus(orderNo) {
  const { appid, privateKey, publicKey } = await getAlipayConfig()
  const { AlipaySdk } = require('alipay-sdk')
  const alipaySdk = new AlipaySdk({ appId: appid, privateKey, alipayPublicKey: publicKey })

  const result = await alipaySdk.exec('alipay.trade.query', {
    bizContent: { out_trade_no: orderNo },
  })

  if (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED') {
    return { paid: true, tradeNo: result.tradeNo }
  }
  return { paid: false }
}

module.exports = {
  createWechatPay,
  createAlipayPay,
  verifyWechatNotify,
  verifyAlipayNotify,
  getEnabledPayMethods,
  queryWechatPayStatus,
  queryAlipayPayStatus,
}
