const { success, error, ErrorCode, paginate } = require('../../utils/response')
const { generateOutlineStream } = require('../../services/outlineService')
const { generateImages, retrySingleImage, createTaskId } = require('../../services/imageService')
const { generateContentStream } = require('../../services/contentService')
const { generateNoteStream } = require('../../services/editorService')
const { analyzeStyle } = require('../../services/styleAnalysisService')
const { publishNote } = require('../../services/publishService')
const { saveGeneration, updateGeneration, getHistory, getDetail, deleteGeneration } = require('../../services/generationService')
const { consumeByModel, consumeByConfig, consumeBatch, refundPoints } = require('../../services/pointService')
const { getUserModels } = require('../../services/aiModelService')
const { getUserTier } = require('../../utils/ai')

const getModels = async (req, res) => {
  try {
    const tier = await getUserTier(req.user)
    const [textModels, imageModels] = await Promise.all([
      getUserModels('text', tier),
      getUserModels('image', tier),
    ])
    return success(res, { text: textModels, image: imageModels })
  } catch (err) {
    return error(res, err.message || '获取模型失败', ErrorCode.INTERNAL)
  }
}

const analyzeStyleHandler = async (req, res) => {
  try {
    const { referenceImages, textModelId, enableThinking } = req.body
    if (!referenceImages?.length) return error(res, '请上传参考图片', ErrorCode.BAD_REQUEST, 400)
    if (!textModelId) return error(res, '请选择文本模型', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByModel(req.user.id, textModelId, '风格分析', !!enableThinking)
    try {
      const result = await analyzeStyle(referenceImages, req.user, textModelId)
      return success(res, { styleAnalysis: result })
    } catch (err) {
      await refundPoints(req.user.id, cost, '风格分析失败退回')
      throw err
    }
  } catch (err) {
    return error(res, err.message || '风格分析失败', ErrorCode.AI_ERROR)
  }
}

const outline = async (req, res) => {
  try {
    const { topic, pageCount, category, referenceImages, styleAnalysis, textModelId, enableThinking } = req.body
    if (!topic?.trim()) return error(res, '请输入创作主题', ErrorCode.BAD_REQUEST, 400)
    if (!textModelId) return error(res, '请选择文本模型', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByModel(req.user.id, textModelId, '大纲生成', !!enableThinking)
    try {
      await generateOutlineStream(res, topic.trim(), pageCount || 5, category || '', referenceImages, styleAnalysis, req.user, textModelId, !!enableThinking)
    } catch (err) {
      await refundPoints(req.user.id, cost, '大纲生成失败退回')
      throw err
    }
  } catch (err) {
    if (!res.headersSent) return error(res, err.message || '大纲生成失败', ErrorCode.AI_ERROR)
    res.end()
  }
}

const generateImagesHandler = async (req, res) => {
  try {
    const { pages, topic, category, styleAnalysis, referenceImages, imageModelId } = req.body
    if (!pages?.length || !topic) return error(res, '缺少大纲或主题', ErrorCode.BAD_REQUEST, 400)
    if (!imageModelId) return error(res, '请选择图片模型', ErrorCode.BAD_REQUEST, 400)
    const totalCost = await consumeBatch(req.user.id, imageModelId, pages.length, '批量生成图片')
    const taskId = createTaskId()
    try {
      await generateImages(res, { taskId, pages, topic, category: category || '', styleAnalysis, referenceImages, user: req.user, modelId: imageModelId })
    } catch (err) {
      await refundPoints(req.user.id, totalCost, '批量图片生成失败退回')
      throw err
    }
  } catch (err) {
    if (!res.headersSent) return error(res, err.message || '图片生成失败', ErrorCode.IMAGE_ERROR)
    res.end()
  }
}

const retryImage = async (req, res) => {
  try {
    const { taskId, page, topic, category, pages, styleAnalysis, referenceImages, imageModelId } = req.body
    if (!taskId || !page || !topic) return error(res, '缺少参数', ErrorCode.BAD_REQUEST, 400)
    if (!imageModelId) return error(res, '请选择图片模型', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByModel(req.user.id, imageModelId, '重试图片生成')
    try {
      const result = await retrySingleImage({ taskId, page, topic, category: category || '', pages: pages || [], styleAnalysis, referenceImages, user: req.user, modelId: imageModelId })
      return success(res, result)
    } catch (err) {
      await refundPoints(req.user.id, cost, '重试图片失败退回')
      throw err
    }
  } catch (err) {
    return error(res, err.message || '图片重试失败', ErrorCode.IMAGE_ERROR)
  }
}

const content = async (req, res) => {
  try {
    const { topic, outline, category, textModelId, enableThinking } = req.body
    if (!topic || !outline) return error(res, '缺少主题或大纲', ErrorCode.BAD_REQUEST, 400)
    if (!textModelId) return error(res, '请选择文本模型', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByModel(req.user.id, textModelId, '内容生成', !!enableThinking)
    try {
      await generateContentStream(res, { topic, outlineText: outline, category: category || '', user: req.user, modelId: textModelId, enableThinking: !!enableThinking })
    } catch (err) {
      await refundPoints(req.user.id, cost, '内容生成失败退回')
      throw err
    }
  } catch (err) {
    if (!res.headersSent) return error(res, err.message || '内容生成失败', ErrorCode.AI_ERROR)
    res.end()
  }
}

const generate = async (req, res) => {
  try {
    const { topic, tone, role, textModelId, enableThinking } = req.body
    if (!topic?.trim()) return error(res, '请输入内容主题', ErrorCode.BAD_REQUEST, 400)
    if (!textModelId) return error(res, '请选择文本模型', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByModel(req.user.id, textModelId, '笔记生成', !!enableThinking)
    try {
      await generateNoteStream(res, { topic: topic.trim(), tone, role, user: req.user, modelId: textModelId, enableThinking: !!enableThinking })
    } catch (err) {
      await refundPoints(req.user.id, cost, '笔记生成失败退回')
      throw err
    }
  } catch (err) {
    if (!res.headersSent) return error(res, err.message || '生成失败', ErrorCode.AI_ERROR)
    res.end()
  }
}

const publish = async (req, res) => {
  try {
    const { title, content, images } = req.body
    if (!title?.trim() || !content?.trim()) return error(res, '标题和内容不能为空', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByConfig(req.user.id, 'points_per_publish', '一键发布')
    try {
      const result = await publishNote({ title: title.trim(), content: content.trim(), images: images || [] })
      return success(res, result)
    } catch (err) {
      await refundPoints(req.user.id, cost, '发布失败退回')
      throw err
    }
  } catch (err) {
    return error(res, err.message || '发布失败', ErrorCode.BAD_REQUEST)
  }
}

const save = async (req, res) => {
  try {
    const { type, title, content, images, tags, topic, category, pointsCost, model } = req.body
    if (!type) return error(res, '缺少生成类型', ErrorCode.BAD_REQUEST, 400)
    const result = await saveGeneration(req.user.id, { type, title, content, images, tags, topic, category, pointsCost, model })
    return success(res, result)
  } catch (err) {
    return error(res, err.message || '保存失败', ErrorCode.INTERNAL)
  }
}

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { title, content, images, tags, topic, category, pointsCost } = req.body
    const result = await updateGeneration(req.user.id, id, { title, content, images, tags, topic, category, pointsCost })
    return success(res, result)
  } catch (err) {
    return error(res, err.message || '更新失败', err.code || ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const history = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const type = req.query.type || undefined
    const { list, total } = await getHistory(req.user.id, { page, pageSize, type })
    return paginate(res, list, { page, pageSize, total })
  } catch (err) {
    return error(res, err.message || '获取失败', ErrorCode.INTERNAL)
  }
}

const historyDetail = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await getDetail(req.user.id, id)
    return success(res, result)
  } catch (err) {
    return error(res, err.message || '获取失败', err.code === ErrorCode.NOT_FOUND ? ErrorCode.NOT_FOUND : ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const historyDelete = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await deleteGeneration(req.user.id, id)
    return success(res)
  } catch (err) {
    return error(res, err.message || '删除失败', err.code === ErrorCode.NOT_FOUND ? ErrorCode.NOT_FOUND : ErrorCode.INTERNAL, err.code === ErrorCode.NOT_FOUND ? 404 : 500)
  }
}

const aiAssist = async (req, res) => {
  try {
    const { selectedText, prompt, textModelId, enableThinking } = req.body
    if (!selectedText?.trim() || !prompt?.trim()) return error(res, '缺少参数', ErrorCode.BAD_REQUEST, 400)
    if (!textModelId) return error(res, '请选择文本模型', ErrorCode.BAD_REQUEST, 400)
    const cost = await consumeByModel(req.user.id, textModelId, 'AI 编辑辅助', !!enableThinking)
    try {
      const { generateTextStream } = require('../../utils/ai')
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
      const stream = await generateTextStream(`${prompt}\n\n${selectedText}`, { temperature: 0.8, maxTokens: 2000, user: req.user, modelId: textModelId, enableThinking: !!enableThinking })
      let fullText = ''
      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content || ''
        if (!text) continue
        fullText += text
        res.write(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`)
      }
      res.write(`event: done\ndata: ${JSON.stringify({ result: fullText })}\n\n`)
      res.end()
    } catch (err) {
      await refundPoints(req.user.id, cost, 'AI 编辑辅助失败退回')
      if (!res.headersSent) throw err
      res.end()
    }
  } catch (err) {
    if (!res.headersSent) return error(res, err.message || 'AI 辅助失败', ErrorCode.AI_ERROR)
  }
}

const checkSensitive = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return success(res, [])
    const sensitiveWordService = require('../../services/sensitiveWordService')
    const found = await sensitiveWordService.check(text)
    return success(res, found)
  } catch (err) {
    return error(res, err.message || '检测失败', ErrorCode.INTERNAL)
  }
}

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return error(res, '请选择图片', ErrorCode.BAD_REQUEST, 400)
    const url = `/api/uploads/${req.file.filename}`
    return success(res, { url })
  } catch (err) {
    return error(res, err.message || '上传失败', ErrorCode.INTERNAL)
  }
}

module.exports = { getModels, analyzeStyleHandler, outline, generateImagesHandler, retryImage, content, generate, publish, uploadImage, aiAssist, checkSensitive, save, update, history, historyDetail, historyDelete }
