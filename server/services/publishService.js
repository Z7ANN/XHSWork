const { createError, ErrorCode } = require('../utils/response')

const API_URL = process.env.PUBLISH_API_URL || 'https://www.myaibot.vip'
const API_KEY = process.env.PUBLISH_API_KEY

async function publishNote({ title, content, images, video, cover }) {
  if (!API_KEY) throw createError('未配置发布 API 密钥', ErrorCode.BAD_REQUEST)

  // 自动识别类型：有 video 参数则为视频笔记，否则为图文笔记
  const type = video ? 'video' : 'normal'

  if (type === 'normal') {
    if (!images || images.length === 0) throw createError('图文笔记必须包含图片', ErrorCode.BAD_REQUEST)
    // 校验图片：必须是公网可访问的 URL
    for (const img of images) {
      if (img.startsWith('data:')) {
        throw createError('图片不支持 base64 格式，请确保图片已上传至服务器', ErrorCode.BAD_REQUEST)
      }
      if (/localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./.test(img)) {
        throw createError('图片 URL 需要公网可访问，本地地址无法用于发布', ErrorCode.BAD_REQUEST)
      }
    }
  } else if (type === 'video') {
    if (!video) throw createError('视频笔记必须包含视频 URL', ErrorCode.BAD_REQUEST)
  }

  const body = { api_key: API_KEY, type }
  if (title) body.title = title
  if (content) body.content = content
  if (type === 'normal') body.images = images
  if (type === 'video') {
    body.video = video
    if (cover) body.cover = cover
  }

  const res = await fetch(`${API_URL}/api/rednote/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!data.success) {
    const msg = data.error?.message || '发布失败'
    throw createError(msg, ErrorCode.BAD_REQUEST)
  }

  return data.data
}

module.exports = { publishNote }
