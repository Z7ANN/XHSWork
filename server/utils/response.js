const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  AI_ERROR: 'AI_ERROR',
  IMAGE_ERROR: 'IMAGE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  INTERNAL: 'INTERNAL',
}

function createError(message, code = ErrorCode.INTERNAL) {
  const err = new Error(message)
  err.code = code
  return err
}

function success(res, data = null) {
  return res.json({ success: true, data })
}

function error(res, message, code = ErrorCode.INTERNAL, status = 500) {
  return res.status(status).json({ success: false, error: { code, message } })
}

function paginate(res, list, { page, pageSize, total, ...extra }) {
  return res.json({
    success: true,
    data: { list, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }, ...extra },
  })
}

module.exports = { ErrorCode, createError, success, error, paginate }
