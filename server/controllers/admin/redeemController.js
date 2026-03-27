const { success, error, paginate, ErrorCode } = require('../../utils/response')
const redeemService = require('../../services/redeemService')

const statusMap = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.NOT_FOUND]: 404,
}
const getStatus = (code) => statusMap[code] || 500

const create = async (req, res) => {
  try {
    const { packageId, points, vipDays, remark, expireAt, count } = req.body
    const codes = await redeemService.createCodes({ packageId, points, vipDays, remark, expireAt, count })
    return success(res, codes)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const status = req.query.status || undefined
    const keyword = req.query.keyword || undefined
    const { list: data, total } = await redeemService.getList({ page, pageSize, status, keyword })
    return paginate(res, data, { page, pageSize, total })
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

const remove = async (req, res) => {
  try {
    await redeemService.remove(parseInt(req.params.id))
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, getStatus(err.code))
  }
}

module.exports = { create, list, remove }
