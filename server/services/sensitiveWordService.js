const sensitiveWordRepository = require('../repositories/sensitiveWordRepository')
const { createError, ErrorCode } = require('../utils/response')

let cache = null
let cacheTime = 0
const CACHE_TTL = 60 * 1000

const clearCache = () => { cache = null; cacheTime = 0 }

const getEnabledWords = async () => {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache
  cache = await sensitiveWordRepository.findEnabled()
  cacheTime = Date.now()
  return cache
}

const check = async (text) => {
  const words = await getEnabledWords()
  const found = []
  for (const w of words) {
    const regex = new RegExp(w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      found.push({
        id: w.id,
        word: match[0],
        category: w.category,
        replacements: w.replacements,
        index: match.index,
        length: match[0].length,
      })
    }
  }
  return found
}

const list = async (params) => sensitiveWordRepository.findAll(params)

const create = async (data) => {
  if (!data.word?.trim()) throw createError('违禁词不能为空', ErrorCode.BAD_REQUEST)
  const id = await sensitiveWordRepository.create(data)
  clearCache()
  return { id }
}

const update = async (id, data) => {
  const row = await sensitiveWordRepository.findById(id)
  if (!row) throw createError('违禁词不存在', ErrorCode.NOT_FOUND)
  await sensitiveWordRepository.update(id, data)
  clearCache()
}

const remove = async (id) => {
  await sensitiveWordRepository.remove(id)
  clearCache()
}

const batchCreate = async (words) => {
  await sensitiveWordRepository.batchCreate(words)
  clearCache()
}

module.exports = { check, list, create, update, remove, batchCreate, clearCache }
