const { success, error, paginate, ErrorCode } = require('../../utils/response')
const generationService = require('../../services/generationService')

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, keyword, category, startDate, endDate } = req.query
    const { list: items, total } = await generationService.getAdminList({
      page: Number(page), pageSize: Number(pageSize), type, keyword, category, startDate, endDate,
    })
    return paginate(res, items, { page: Number(page), pageSize: Number(pageSize), total })
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

const stats = async (req, res) => {
  try {
    const data = await generationService.getAdminStats()
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

const detail = async (req, res) => {
  try {
    const data = await generationService.adminDetail(Number(req.params.id))
    return success(res, data)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const remove = async (req, res) => {
  try {
    await generationService.adminDelete(Number(req.params.id))
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const batchRemove = async (req, res) => {
  try {
    const { ids } = req.body
    await generationService.adminBatchDelete(ids)
    return success(res)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

module.exports = { list, stats, detail, remove, batchRemove }
