const { success, error, paginate, ErrorCode } = require('../../utils/response')
const userService = require('../../services/userService')

const statusMap = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
}

const getStatus = (code) => statusMap[code] || 500

const getProfile = async (req, res) => {
  try {
    const data = await userService.getProfile(req.user.id)
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const updateProfile = async (req, res) => {
  try {
    const { nickname } = req.body
    const data = await userService.updateProfile(req.user.id, { nickname })
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return error(res, '请选择图片', ErrorCode.BAD_REQUEST, 400)
    const avatarUrl = `/api/uploads/${req.file.filename}`
    const data = await userService.updateProfile(req.user.id, { avatar: avatarUrl })
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const getPointLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const { list, total } = await userService.getPointLogs(req.user.id, page)
    return paginate(res, list, { page, pageSize: 10, total })
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const getInviteList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const { list, total } = await userService.getInviteList(req.user.id, page)
    return paginate(res, list, { page, pageSize: 10, total })
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const getInviteStats = async (req, res) => {
  try {
    const data = await userService.getInviteStats(req.user.id)
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const bindInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode) return error(res, '请输入邀请码', ErrorCode.BAD_REQUEST, 400)
    await userService.bindInviteCode(req.user.id, inviteCode)
    return success(res, null)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    await userService.changePassword(req.user.id, oldPassword, newPassword)
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const changeEmail = async (req, res) => {
  try {
    const { email, code } = req.body
    const data = await userService.changeEmail(req.user.id, email, code)
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

module.exports = { getProfile, updateProfile, uploadAvatar, getPointLogs, getInviteList, getInviteStats, bindInviteCode, changePassword, changeEmail }
