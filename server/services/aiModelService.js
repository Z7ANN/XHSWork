const aiModelRepository = require('../repositories/aiModelRepository')
const { createError, ErrorCode } = require('../utils/response')

// 轮询索引 Map: key = "text_normal" | "text_vip" | "image_normal" | "image_vip"
const roundRobinIndex = new Map()

// 模型缓存
let modelCache = null
let cacheTime = 0
const CACHE_TTL = 30 * 1000 // 30秒缓存

const clearCache = () => {
  modelCache = null
  cacheTime = 0
}

const getModels = async () => {
  if (modelCache && Date.now() - cacheTime < CACHE_TTL) return modelCache
  modelCache = await aiModelRepository.findAll()
  cacheTime = Date.now()
  return modelCache
}

const getNextModel = async (type, tier) => {
  const models = await aiModelRepository.findEnabled(type, tier)
  if (!models.length) {
    throw createError(`没有可用的${type === 'text' ? '文本' : '图片'}模型`, ErrorCode.AI_ERROR)
  }
  const key = `${type}_${tier}`
  const idx = roundRobinIndex.get(key) || 0
  const model = models[idx % models.length]
  roundRobinIndex.set(key, (idx + 1) % models.length)
  return model
}

const getModelById = async (id) => {
  const model = await aiModelRepository.findById(id)
  if (!model || model.status !== 1) {
    throw createError('模型不存在或已禁用', ErrorCode.BAD_REQUEST)
  }
  return model
}

const getUserModels = async (type, tier) => {
  const models = await aiModelRepository.findEnabled(type, tier)
  return models.map(m => ({ id: m.id, name: m.name, icon: m.icon, type: m.type, tier: m.tier, pointsCost: m.pointsCost, supportThinking: m.type === 'image' ? 0 : m.supportThinking, thinkingPointsCost: m.type === 'image' ? 0 : m.thinkingPointsCost }))
}

const list = async () => {
  return await getModels()
}

const create = async (data) => {
  if (!data.name || !data.type || !data.baseUrl || !data.apiKey || !data.model) {
    throw createError('缺少必填字段', ErrorCode.BAD_REQUEST)
  }
  const id = await aiModelRepository.create(data)
  clearCache()
  return { id }
}

const updateModel = async (id, data) => {
  const row = await aiModelRepository.findById(id)
  if (!row) throw createError('模型不存在', ErrorCode.NOT_FOUND)
  await aiModelRepository.update(id, data)
  clearCache()
}

const remove = async (id) => {
  const row = await aiModelRepository.findById(id)
  if (!row) throw createError('模型不存在', ErrorCode.NOT_FOUND)
  await aiModelRepository.remove(id)
  clearCache()
}

module.exports = { getNextModel, getModelById, getUserModels, list, create, updateModel, remove, clearCache }
