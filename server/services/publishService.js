const { createError, ErrorCode } = require('../utils/response')

const API_URL = process.env.PUBLISH_API_URL || 'https://www.myaibot.vip'
const API_KEY = process.env.PUBLISH_API_KEY

async function publishNote({ title, content, images }) {
  if (!API_KEY) throw createError('未配置发布 API 密钥', ErrorCode.BAD_REQUEST)

  // 校验图片：必须是公网可访问的 URL
  if (images && images.length > 0) {
    for (const img of images) {
      if (img.startsWith('data:')) {
        throw createError('图片不支持 base64 格式，请确保图片已上传至服务器', ErrorCode.BAD_REQUEST)
      }
      if (/localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./.test(img)) {
        throw createError('图片 URL 需要公网可访问，本地地址无法用于发布', ErrorCode.BAD_REQUEST)
      }
    }
  }

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
