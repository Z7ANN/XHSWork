const { error, ErrorCode } = require('../utils/response')

const rateLimit = ({ windowMs = 60000, max = 5, message = '操作过于频繁，请稍后再试' } = {}) => {
  const store = new Map()

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
    const key = `${req.user?.id || ip}`
    const now = Date.now()
    const record = store.get(key)

    if (!record || now - record.start > windowMs) {
      store.set(key, { start: now, count: 1 })
      return next()
    }

    record.count++
    if (record.count > max) {
      return error(res, message, ErrorCode.BAD_REQUEST, 429)
    }
    next()
  }
}

module.exports = { rateLimit }
