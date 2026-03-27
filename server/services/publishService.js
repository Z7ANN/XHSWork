const { createError, ErrorCode } = require('../utils/response')

const API_URL = process.env.PUBLISH_API_URL || 'https://www.myaibot.vip'
const API_KEY = process.env.PUBLISH_API_KEY

async function publishNote({ title, content, images }) {
  if (!API_KEY) throw createError('未配置发布 API 密钥', ErrorCode.BAD_REQUEST)

  const res = await fetch(`${API_URL}/api/rednote/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: API_KEY,
      type: 'normal',
      title,
      content,
      images: images || [],
    }),
  })

  const data = await res.json()
  if (!res.ok || data.code !== 200) {
    throw createError(data.message || '发布失败', ErrorCode.BAD_REQUEST)
  }

  return data.data
}

module.exports = { publishNote }
