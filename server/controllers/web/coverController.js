const { success, error, ErrorCode } = require('../../utils/response')
const { generateCover } = require('../../services/coverService')
const { consumeByModel, refundPoints } = require('../../services/pointService')

const generate = async (req, res) => {
  try {
    const { prompt, style = 'xiaohongshu', size = '3:4', referenceImage, imageModelId } = req.body
    if (!prompt?.trim()) return error(res, '请输入图片描述', ErrorCode.BAD_REQUEST, 400)
    if (!imageModelId) return error(res, '请选择图片模型', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByModel(req.user.id, imageModelId, '封面生成')
    try {
      const result = await generateCover({ prompt: prompt.trim(), style, size, referenceImage, user: req.user, modelId: imageModelId })
      return success(res, result)
    } catch (err) {
      await refundPoints(req.user.id, cost, '封面生成失败退回')
      throw err
    }
  } catch (err) {
    return error(res, err.message || '生成失败', ErrorCode.AI_ERROR)
  }
}

module.exports = { generate }
