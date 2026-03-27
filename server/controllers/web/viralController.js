const { success, error, ErrorCode } = require('../../utils/response')
const { fetchNote, rewriteNote, replicateImages } = require('../../services/viralService')
const { consumeByModel, consumeBatch, refundPoints } = require('../../services/pointService')
const { saveGeneration } = require('../../services/generationService')

const fetch = async (req, res) => {
  try {
    const { url } = req.body
    if (!url?.trim()) return error(res, '请输入笔记链接', ErrorCode.BAD_REQUEST, 400)
    const result = await fetchNote(url.trim())
    return success(res, result)
  } catch (err) {
    return error(res, err.message || '解析失败', ErrorCode.AI_ERROR)
  }
}

const rewrite = async (req, res) => {
  try {
    const { title, content, tags, requirement, url, textModelId, enableThinking } = req.body
    if (!title || !content || !requirement?.trim()) return error(res, '缺少必要参数', ErrorCode.BAD_REQUEST, 400)
    if (!textModelId) return error(res, '请选择文本模型', ErrorCode.BAD_REQUEST, 400)
    const pointsCost = await consumeByModel(req.user.id, textModelId, '爆款仿写', !!enableThinking)
    try {
      const result = await rewriteNote({ title, content, tags: tags || [], requirement: requirement.trim(), user: req.user, modelId: textModelId, enableThinking: !!enableThinking })
      const { getModelById } = require('../../services/aiModelService')
      const modelInfo = await getModelById(textModelId)
      await saveGeneration(req.user.id, {
        type: 'viral',
        title: result.title,
        content: JSON.stringify({ original: { title, content, tags }, rewrite: result, requirement: requirement.trim(), url: url || '' }),
        tags: result.tags,
        topic: url || '',
        category: '爆款复刻',
        pointsCost,
        model: modelInfo.model,
      })
      return success(res, result)
    } catch (err) {
      await refundPoints(req.user.id, pointsCost, '爆款仿写失败退回')
      throw err
    }
  } catch (err) {
    return error(res, err.message || '仿写失败', ErrorCode.AI_ERROR)
  }
}

const replicateImagesHandler = async (req, res) => {
  try {
    const { images, requirement, imageModelId } = req.body
    if (!images?.length) return error(res, '请提供需要复刻的图片', ErrorCode.BAD_REQUEST, 400)
    if (!imageModelId) return error(res, '请选择图片模型', ErrorCode.BAD_REQUEST, 400)
    const totalCost = await consumeBatch(req.user.id, imageModelId, images.length, '图片复刻')
    try {
      const result = await replicateImages({ images, requirement: requirement || '', user: req.user, modelId: imageModelId })
      await saveGeneration(req.user.id, {
        type: 'viral',
        title: '图片复刻',
        content: '',
        images: result.images,
        topic: '',
        category: '图片复刻',
        pointsCost: totalCost,
      })
      return success(res, result)
    } catch (err) {
      await refundPoints(req.user.id, totalCost, '图片复刻失败退回')
      throw err
    }
  } catch (err) {
    return error(res, err.message || '图片复刻失败', ErrorCode.AI_ERROR)
  }
}

module.exports = { fetch, rewrite, replicateImages: replicateImagesHandler }
