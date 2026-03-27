const { error, ErrorCode } = require('../utils/response')
const { verifyToken } = require('../services/authService')
const userRepository = require('../repositories/userRepository')

const auth = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return error(res, '未登录', ErrorCode.UNAUTHORIZED, 401)
  }
  try {
    const payload = verifyToken(header.slice(7))
    const user = await userRepository.findById(payload.id)
    if (!user || user.status === 0) {
      return error(res, '账号不存在或已被禁用', ErrorCode.UNAUTHORIZED, 401)
    }
    req.user = { id: user.id, role: user.role }
    next()
  } catch {
    return error(res, '登录已过期', ErrorCode.UNAUTHORIZED, 401)
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return error(res, '无权限', ErrorCode.FORBIDDEN, 403)
  }
  next()
}

module.exports = { auth, adminOnly }
