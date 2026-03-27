const { success, error, paginate, ErrorCode } = require('../../utils/response')
const orderService = require('../../services/orderService')

const create = async (req, res) => {
  try {
    const { packageId, payMethod } = req.body
    if (!packageId || !payMethod) return error(res, '缺少参数', ErrorCode.BAD_REQUEST, 400)
    const data = await orderService.createOrder(req.user.id, { packageId, payMethod })
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.BAD_REQUEST ? 400 : 500)
  }
}

const status = async (req, res) => {
  try {
    const data = await orderService.getOrderStatus(req.params.orderNo, req.user.id)
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, 500)
  }
}

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const { list: items, total } = await orderService.getUserOrders(req.user.id, { page, pageSize })
    return paginate(res, items, { page, pageSize, total })
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL, 500)
  }
}

const cancel = async (req, res) => {
  try {
    await orderService.cancelOrder(req.params.orderNo, req.user.id)
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, 500)
  }
}

module.exports = { create, status, list, cancel }
