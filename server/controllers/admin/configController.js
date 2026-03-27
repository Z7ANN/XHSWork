const { success, error, ErrorCode } = require('../../utils/response')
const configService = require('../../services/configService')

const list = async (req, res) => {
  try {
    const data = await configService.getConfigs()
    return success(res, data)
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
}

const update = async (req, res) => {
  try {
    const { configs } = req.body
    if (!Array.isArray(configs) || !configs.length) {
      return error(res, '请提供配置数据', ErrorCode.BAD_REQUEST, 400)
    }
    await configService.updateConfigs(configs)
    return success(res)
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
}

const uploadQrcode = async (req, res) => {
  try {
    if (!req.file) return error(res, '请选择图片', ErrorCode.BAD_REQUEST, 400)
    const url = `/api/uploads/${req.file.filename}`
    return success(res, { url })
  } catch (err) {
    return error(res, err.message, ErrorCode.INTERNAL)
  }
}

module.exports = { list, update, uploadQrcode }
