const { success, error, paginate, ErrorCode } = require('../../utils/response')
const orderService = require('../../services/orderService')

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const status = req.query.status !== undefined ? parseInt(req.query.status) : undefined
    const keyword = req.query.keyword || undefined
    const startDate = req.query.startDate || undefined
    const endDate = req.query.endDate || undefined
    const { list: items, total, totalAmount } = await orderService.getAllOrders({ page, pageSize, status, keyword, startDate, endDate })
    return paginate(res, items, { page, pageSize, total, totalAmount })
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL, 500)
  }
}

const cancel = async (req, res) => {
  try {
    await orderService.adminCancelOrder(req.params.orderNo)
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.BAD_REQUEST || err.code === ErrorCode.NOT_FOUND ? 400 : 500)
  }
}

const complete = async (req, res) => {
  try {
    await orderService.adminCompleteOrder(req.params.orderNo)
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.BAD_REQUEST || err.code === ErrorCode.NOT_FOUND ? 400 : 500)
  }
}

module.exports = { list, cancel, complete }
