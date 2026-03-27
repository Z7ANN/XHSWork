const { error, ErrorCode } = require('../utils/response')

const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message)
  const statusMap = {
    [ErrorCode.BAD_REQUEST]: 400,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.CONFLICT]: 409,
  }
  const status = statusMap[err.code] || 500
  return error(res, err.message || '服务器内部错误', err.code || ErrorCode.INTERNAL, status)
}

module.exports = errorHandler
