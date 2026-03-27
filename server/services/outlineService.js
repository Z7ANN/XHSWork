const { generateTextStream } = require('../utils/ai')

const promptTemplate = require('../prompts/outline')

const typeMapping = { '封面': 'cover', '内容': 'content', '总结': 'summary' }

function parsePage(text) {
  const trimmed = text.trim()
  if (!trimmed) return null

  let type = 'content'
  const typeMatch = trimmed.match(/^\[(\S+)\]/)
  if (typeMatch) {
    type = typeMapping[typeMatch[1]] || 'content'
  }

  let content = trimmed
  let imageHint = ''
  const hintMatch = trimmed.match(/配图建议[：:]\s*([\s\S]+)$/m)
  if (hintMatch) {
    imageHint = hintMatch[1].trim()
    content = trimmed.slice(0, hintMatch.index).trim()
  }

  return { type, content, imageHint }
}

async function generateOutlineStream(res, topic, pageCount, category, referenceImage, styleAnalysis, user, modelId, enableThinking) {
  const styleBlock = styleAnalysis
    ? `\n参考图片风格分析：\n${styleAnalysis}`
    : ''

  const prompt = promptTemplate
    .replace('{topic}', topic)
    .replace('{pageCount}', String(pageCount))
    .replace('{category}', category || '通用')
    .replace('{styleAnalysisBlock}', styleBlock)

  const messages = []
  if (referenceImage) {
    const images = Array.isArray(referenceImage) ? referenceImage : [referenceImage]
    const imageContents = images.map((img) => ({
      type: 'image_url',
      image_url: { url: img },
    }))
    messages.push({
      role: 'user',
      content: [
        ...imageContents,
        { type: 'text', text: prompt + '\n\n请参考上面的图片风格来生成大纲，配图建议要尽量还原参考图的视觉风格。' },
      ],
    })
  } else {
    messages.push({ role: 'user', content: prompt })
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const stream = await generateTextStream({ messages }, { user, modelId, enableThinking })
    let buffer = ''
    let pageIndex = 0

    for await (const chunk of stream) {
      if (res.destroyed) return
      const delta = chunk.choices?.[0]?.delta?.content || ''
      if (!delta) continue

      buffer += delta

      let splitPos = buffer.indexOf('<page>')
      while (splitPos !== -1) {
        const pageText = buffer.slice(0, splitPos)
        buffer = buffer.slice(splitPos + 6)

        const page = parsePage(pageText)
        if (page) {
          sendEvent('page', {
            id: `page-${pageIndex + 1}`,
            index: pageIndex,
            type: page.type,
            content: page.content,
            imageHint: page.imageHint,
          })
          pageIndex++
        }
        splitPos = buffer.indexOf('<page>')
      }

      if (buffer.trim()) {
        const draft = parsePage(buffer)
        sendEvent('typing', {
          text: buffer.trim(),
          type: draft?.type || 'content',
          imageHint: draft?.imageHint || '',
        })
      }
    }

    const lastPage = parsePage(buffer)
    if (lastPage) {
      sendEvent('page', {
        id: `page-${pageIndex + 1}`,
        index: pageIndex,
        type: lastPage.type,
        content: lastPage.content,
        imageHint: lastPage.imageHint,
      })
      pageIndex++
    }

    sendEvent('finish', { total: pageIndex })
  } catch (err) {
    sendEvent('error', { message: err.message || '大纲生成失败' })
  }

  res.end()
}

module.exports = { generateOutlineStream }
