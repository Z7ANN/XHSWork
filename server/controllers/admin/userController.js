const { success, error, paginate, ErrorCode } = require('../../utils/response')
const userService = require('../../services/userService')

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, vip } = req.query
    const { list: users, total } = await userService.getUsers({
      page: Number(page), pageSize: Number(pageSize),
      keyword, status: status !== undefined ? Number(status) : undefined,
      vip: vip !== undefined ? Number(vip) : undefined,
    })
    return paginate(res, users, { page: Number(page), pageSize: Number(pageSize), total })
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
}

const detail = async (req, res) => {
  try {
    const user = await userService.getUserDetail(Number(req.params.id))
    return success(res, user)
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

const updateStatus = async (req, res) => {
  try {
    const { status: newStatus } = req.body
    if (newStatus === undefined) return error(res, '缺少 status 参数', ErrorCode.BAD_REQUEST, 400)
    await userService.updateUserStatus(Number(req.params.id), newStatus, req.user.id)
    return success(res)
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

const adjustPoints = async (req, res) => {
  try {
    const { amount, remark } = req.body
    if (!amount || amount === 0) return error(res, '积分数量不能为0', ErrorCode.BAD_REQUEST, 400)
    await userService.adjustPoints(Number(req.params.id), Number(amount), remark)
    return success(res)
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

const setVip = async (req, res) => {
  try {
    const { vipExpireAt } = req.body
    await userService.setVipExpireAt(Number(req.params.id), vipExpireAt || null)
    return success(res)
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

const resetPassword = async (req, res) => {
  try {
    await userService.resetPassword(Number(req.params.id))
    return success(res)
  } catch (err) {
    const status = err.code === ErrorCode.NOT_FOUND ? 404 : 500
    return error(res, err.message, err.code || ErrorCode.INTERNAL, status)
  }
}

module.exports = { list, detail, updateStatus, adjustPoints, setVip, resetPassword }
