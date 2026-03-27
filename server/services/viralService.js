const { generateText, generateImage } = require('../utils/ai')
const { stripMarkdown } = require('../utils/text')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { createError, ErrorCode } = require('../utils/response')

const outputRoot = path.join(__dirname, '../output')
if (!fs.existsSync(outputRoot)) fs.mkdirSync(outputRoot, { recursive: true })

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+name=["']${name}["']`, 'i'),
    new RegExp(`<meta\\s+property=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return m[1]
  }
  return ''
}

function extractAllMeta(html, name) {
  const results = []
  const patterns = [
    new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'gi'),
    new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+name=["']${name}["']`, 'gi'),
    new RegExp(`<meta\\s+property=["']${name}["']\\s+content=["']([^"']*)["']`, 'gi'),
  ]
  for (const p of patterns) {
    let m
    while ((m = p.exec(html)) !== null) {
      if (m[1] && !results.includes(m[1])) results.push(m[1])
    }
  }
  return results
}

async function fetchNote(url) {
  if (!url) throw createError('请输入笔记链接', ErrorCode.BAD_REQUEST)

  // 处理短链接，提取真实URL
  let fetchUrl = url.trim()
  if (fetchUrl.includes('xhslink.com') || fetchUrl.includes('xiaohongshu.com')) {
    // 从文本中提取URL
    const urlMatch = fetchUrl.match(/https?:\/\/[^\s]+/)
    if (urlMatch) fetchUrl = urlMatch[0]
  }

  try {
    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`请求失败: ${res.status}`)
    const html = await res.text()

    // 从 meta 标签解析
    const ogTitle = extractMeta(html, 'og:title')
    const title = ogTitle ? decodeHtmlEntities(ogTitle.replace(/\s*-\s*小红书$/, '').trim()) : ''
    const description = decodeHtmlEntities(extractMeta(html, 'description') || '')
    const keywords = extractMeta(html, 'keywords') || ''
    const images = extractAllMeta(html, 'og:image')

    if (!title && !description) {
      throw createError('无法解析该链接，请确认是小红书笔记链接', ErrorCode.BAD_REQUEST)
    }

    // 尝试从页面 JSON 数据中提取完整正文（带换行格式）
    let fullContent = ''
    const jsonPatterns = [
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*<\/script>/,
      /"desc"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"note"\s*:.*?"desc"\s*:\s*"((?:[^"\\]|\\.)*)"/,
    ]
    for (const pattern of jsonPatterns.slice(1)) {
      const m = html.match(pattern)
      if (m && m[1]) {
        try {
          const decoded = JSON.parse(`"${m[1]}"`)
          if (decoded.length > fullContent.length) fullContent = decoded
        } catch {}
      }
    }
    // 尝试从 INITIAL_STATE 提取
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)
    if (stateMatch) {
      try {
        const cleaned = stateMatch[1].replace(/undefined/g, 'null')
        const state = JSON.parse(cleaned)
        const noteData = state?.note?.noteDetailMap
        if (noteData) {
          const firstNote = Object.values(noteData)[0]
          const desc = firstNote?.note?.desc
          if (desc && desc.length > fullContent.length) fullContent = desc
        }
      } catch {}
    }

    const content = fullContent || description
    const tags = []

    // 提取 #标签
    const tagMatches = content.match(/#[^\s#]+/g)
    if (tagMatches) {
      tagMatches.forEach(t => tags.push(t.replace('#', '')))
    }

    // 如果没有从内容提取到标签，从 keywords 提取
    if (tags.length === 0 && keywords) {
      keywords.split(/[,，]/).forEach(k => {
        const t = k.trim()
        if (t && !tags.includes(t)) tags.push(t)
      })
    }

    // 正文去掉标签部分
    let cleanContent = content.replace(/#[^\s#]+/g, '').trim()
    // 解码可能残留的 HTML 实体
    cleanContent = decodeHtmlEntities(cleanContent)

    return { title, content: cleanContent, tags: [...new Set(tags)], images }
  } catch (err) {
    if (err.code) throw err
    throw createError('笔记解析失败，请检查链接是否正确', ErrorCode.BAD_REQUEST)
  }
}

async function rewriteNote({ title, content, tags, requirement, user, modelId, enableThinking }) {
  const prompt = `你是一个小红书爆款文案专家。请根据以下原笔记内容和用户的仿写需求，生成仿写后的标题、正文和标签。

原笔记标题：${title}
原笔记正文：
${content}
原笔记标签：${tags.join('、')}

用户仿写需求：${requirement}

请严格按以下 JSON 格式返回，不要有任何其他内容：
{
  "title": "仿写后的标题",
  "content": "仿写后的正文（保持小红书风格，使用 emoji、换行、序号等排版）",
  "tags": ["标签1", "标签2", "标签3", "标签4"]
}

要求：
1. 保持原笔记的爆款结构和写作手法
2. 根据用户需求调整主题和内容
3. 标题要有吸引力，使用小红书常见的爆款标题公式
4. 正文保持原文的排版风格（emoji、序号、换行等）
5. 标签要与新主题相关，4-6个
6. 禁止使用任何 markdown 格式（不要用 **加粗**、# 标题、* 列表、> 引用等），直接输出纯文本和 emoji`

  const result = await generateText(prompt, { temperature: 0.8, maxTokens: 2000, user, modelId, enableThinking })

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 返回格式错误')
    const parsed = JSON.parse(jsonMatch[0])
    parsed.content = stripMarkdown(parsed.content || '')
    parsed.title = stripMarkdown(parsed.title || '')
    return parsed
  } catch {
    throw new Error('AI 返回解析失败')
  }
}

async function replicateImages({ images, requirement, user, modelId }) {
  const taskId = `viral_${uuidv4().replace(/-/g, '').slice(0, 12)}`
  const taskDir = path.join(outputRoot, taskId)
  if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true })

  const results = []

  for (let i = 0; i < images.length; i++) {
    const analyzePrompt = `请分析这张小红书笔记图片的内容，详细描述图片中的：
1. 主体内容（人物、物品、场景）
2. 构图方式（平铺、特写、全景等）
3. 色调和风格（暖色、冷色、清新、复古等）
4. 文字排版（如果有文字覆盖）

用户的复刻需求：${requirement || '保持相同风格'}

请基于分析结果，生成一段适合文生图的英文提示词（prompt），用于生成风格相似但内容根据用户需求调整的新图片。只返回英文提示词，不要其他内容。`

    const imagePrompt = await generateText(null, {
      temperature: 0.7,
      maxTokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: images[i] } },
          { type: 'text', text: analyzePrompt },
        ],
      }],
      user,
    })

    const imageBuffer = await generateImage(imagePrompt.trim(), { size: '2K', user, modelId })
    const filename = `${i}.png`
    fs.writeFileSync(path.join(taskDir, filename), imageBuffer)
    results.push(`/api/images/${taskId}/${filename}`)
  }

  return { taskId, images: results }
}

module.exports = { fetchNote, rewriteNote, replicateImages }
