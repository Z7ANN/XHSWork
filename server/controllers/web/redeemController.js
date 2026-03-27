const { success, error, ErrorCode } = require('../../utils/response')
const redeemService = require('../../services/redeemService')

const redeem = async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return error(res, '请输入兑换码', ErrorCode.BAD_REQUEST, 400)
    const result = await redeemService.redeem(req.user.id, code.trim())
    return success(res, result)
  } catch (err) {
    return error(res, err.message, err.code || ErrorCode.INTERNAL, err.code === ErrorCode.BAD_REQUEST ? 400 : 500)
  }
}

module.exports = { redeem }
