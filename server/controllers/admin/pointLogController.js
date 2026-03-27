const { success, error, ErrorCode, paginate } = require('../../utils/response')
const pointRepository = require('../../repositories/pointRepository')

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const { userId, type, keyword } = req.query
    const { list, total } = await pointRepository.findAll({ page, pageSize, userId: userId ? Number(userId) : undefined, type, keyword })
    return paginate(res, list, { page, pageSize, total })
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL)
  }
}

module.exports = { list }
