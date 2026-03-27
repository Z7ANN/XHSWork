const generationRepository = require('../repositories/generationRepository')
const { createError, ErrorCode } = require('../utils/response')

const formatGeneration = (row) => ({
  ...row,
  images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
  tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
})

const validateGenerationOwner = async (userId, id) => {
  const row = await generationRepository.findById(id)
  if (!row || row.userId !== userId) throw createError('记录不存在', ErrorCode.NOT_FOUND)
  return row
}

const saveGeneration = async (userId, data) => {
  const { type, title, content, images, tags, topic, category, pointsCost, model } = data
  if (!type) throw createError('缺少生成类型', ErrorCode.BAD_REQUEST)
  const id = await generationRepository.create({ userId, type, title, content, images, tags, topic, category, pointsCost, model })
  return { id }
}

const updateGeneration = async (userId, id, data) => {
  const row = await generationRepository.findById(id)
  if (!row || row.userId !== userId) throw createError('记录不存在', ErrorCode.NOT_FOUND)
  await generationRepository.update(id, data)
  return { id }
}

const getHistory = async (userId, { page, pageSize, type }) => {
  const { list, total } = await generationRepository.findByUserId(userId, { page, pageSize, type })
  return { list: list.map(formatGeneration), total }
}

const getDetail = async (userId, id) => {
  const row = await validateGenerationOwner(userId, id)
  return formatGeneration(row)
}

const deleteGeneration = async (userId, id) => {
  await validateGenerationOwner(userId, id)
  await generationRepository.deleteById(id)
}

const getAdminList = async (params) => {
  const { list, total } = await generationRepository.findAll(params)
  return { list: list.map(formatGeneration), total }
}

const getAdminStats = async () => {
  return await generationRepository.statsForAdmin()
}

const adminDelete = async (id) => {
  const row = await generationRepository.findById(id)
  if (!row) throw createError('记录不存在', ErrorCode.NOT_FOUND)
  await generationRepository.deleteById(id)
}

const adminBatchDelete = async (ids) => {
  if (!ids || !ids.length) throw createError('请选择要删除的记录', ErrorCode.BAD_REQUEST)
  await generationRepository.deleteByIds(ids)
}

const adminDetail = async (id) => {
  const row = await generationRepository.findById(id)
  if (!row) throw createError('记录不存在', ErrorCode.NOT_FOUND)
  return formatGeneration(row)
}

module.exports = { saveGeneration, updateGeneration, getHistory, getDetail, deleteGeneration, getAdminList, getAdminStats, adminDelete, adminBatchDelete, adminDetail }
