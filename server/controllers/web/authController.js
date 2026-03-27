const { success, error, ErrorCode } = require('../../utils/response')
const authService = require('../../services/authService')

const sendCode = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return error(res, '请输入邮箱', ErrorCode.BAD_REQUEST, 400)
    await authService.sendCode(email)
    return success(res)
  } catch (err) {
    return error(res, err.message || '发送验证码失败', err.code || ErrorCode.INTERNAL, err.code === ErrorCode.BAD_REQUEST ? 400 : 500)
  }
}

const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || ''

const loginByCode = async (req, res) => {
  try {
    const { email, code } = req.body
    if (!email || !code) return error(res, '请输入邮箱和验证码', ErrorCode.BAD_REQUEST, 400)
    const data = await authService.loginByCode(email, code, getIp(req))
    return success(res, data)
  } catch (err) {
    const status = err.code === ErrorCode.BAD_REQUEST ? 400 : err.code === ErrorCode.FORBIDDEN ? 403 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

// 密码登录
const loginByPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return error(res, '请输入邮箱和密码', ErrorCode.BAD_REQUEST, 400)
    const data = await authService.loginByPassword(email, password)
    return success(res, data)
  } catch (err) {
    const status = err.code === ErrorCode.BAD_REQUEST ? 400 : err.code === ErrorCode.FORBIDDEN ? 403 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

// 注册
const register = async (req, res) => {
  try {
    const { email, password, code, inviteCode } = req.body
    if (!email || !password || !code) return error(res, '请填写完整信息', ErrorCode.BAD_REQUEST, 400)
    if (password.length < 6) return error(res, '密码至少6位', ErrorCode.BAD_REQUEST, 400)
    const data = await authService.register(email, password, code, inviteCode || '', getIp(req))
    return success(res, data)
  } catch (err) {
    const status = err.code === ErrorCode.BAD_REQUEST ? 400 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

// 重置密码
const resetPassword = async (req, res) => {
  try {
    const { email, password, code } = req.body
    if (!email || !password || !code) return error(res, '请填写完整信息', ErrorCode.BAD_REQUEST, 400)
    if (password.length < 6) return error(res, '密码至少6位', ErrorCode.BAD_REQUEST, 400)
    await authService.resetPassword(email, password, code)
    return success(res)
  } catch (err) {
    const status = err.code === ErrorCode.BAD_REQUEST ? 400 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

module.exports = { sendCode, loginByCode, loginByPassword, register, resetPassword }
