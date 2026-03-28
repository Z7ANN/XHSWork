const { generateTextStream } = require('../utils/ai')

const promptTemplate = require('../prompts/content')
const { stripMarkdown } = require('../utils/text')

async function generateContentStream(res, { topic, outlineText, category, user, modelId, enableThinking }) {
  const prompt = promptTemplate
    .replace('{topic}', topic)
    .replace('{outline}', outlineText)
    .replace(/\{category\}/g, category || '通用')

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const stream = await generateTextStream(prompt, { user, modelId, enableThinking })

  let fullText = ''

  for await (const chunk of stream) {
    if (res.destroyed) break
    const text = chunk.choices?.[0]?.delta?.content || ''
    if (!text) continue

    fullText += text
    res.write(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`)
  }

  // 解析最终结果
  let title = ''
  let content = ''
  const tags = []

  const titleMatch = fullText.match(/【标题】(.+)/)
  if (titleMatch) {
    title = titleMatch[1].replace(/【标签】.*/, '').trim()
  }

  let body = fullText
  const tIdx = body.indexOf('【标题】')
  if (tIdx !== -1) {
    const nlAfterTitle = body.indexOf('\n', tIdx)
    body = nlAfterTitle !== -1 ? body.slice(nlAfterTitle + 1) : ''
  }
  const tagIdx = body.indexOf('【标签】')
  if (tagIdx !== -1) {
    const tagLine = body.slice(tagIdx + 4).trim()
    tagLine.split(/\s+/).forEach(t => { if (t) tags.push(t) })
    body = body.slice(0, tagIdx)
  }
  content = stripMarkdown(body.trim()).replace(/^正文内容\s*/, '')

  res.write(`event: done\ndata: ${JSON.stringify({ title, content, tags })}\n\n`)
  res.end()
}

module.exports = { generateContentStream }
