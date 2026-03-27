const { success, error, ErrorCode } = require('../../utils/response')
const { getStats } = require('../../services/dashboardService')

const index = async (req, res) => {
  try {
    const data = await getStats()
    return success(res, data)
  } catch (err) {
    return error(res, err.message || '获取统计数据失败', ErrorCode.INTERNAL)
  }
}

module.exports = { index }
