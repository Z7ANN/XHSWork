const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { generateText, generateImage } = require('../utils/ai')

const promptGenTemplate = require('../prompts/image_prompt_gen')

const outputRoot = path.join(__dirname, '../output')
if (!fs.existsSync(outputRoot)) fs.mkdirSync(outputRoot, { recursive: true })

async function buildImagePrompt(page, topic, category, outlineText, styleAnalysis, user, modelId) {
  const styleBlock = styleAnalysis
    ? `\n参考图片风格分析（必须严格遵循此风格）：\n${styleAnalysis}`
    : ''

  const genPrompt = promptGenTemplate
    .replace('{pageType}', page.type)
    .replace('{pageContent}', `${page.title || ''}\n${page.content}`)
    .replace('{imageHint}', page.imageHint || '无')
    .replace('{topic}', topic)
    .replace('{category}', category || '通用')
    .replace('{outline}', outlineText)
    .replace('{styleAnalysisBlock}', styleBlock)

  const detailedPrompt = await generateText(genPrompt, { temperature: 0.9, maxTokens: 2000, user })
  return detailedPrompt.trim()
}

function buildOutlineText(pages) {
  return pages
    .map((p, i) => `[${p.type}] 第${i + 1}页: ${p.title}\n${p.content}`)
    .join('\n\n')
}

async function getUserImageConcurrency(user) {
  if (!user?.id) return 1
  const orderRepository = require('../repositories/orderRepository')
  const packageRepository = require('../repositories/packageRepository')
  const order = await orderRepository.findLatestPaidSubscription(user.id)
  if (!order) return 1
  const pkg = await packageRepository.findById(order.packageId)
  return pkg?.imageConcurrency || 1
}

async function generateImages(res, { taskId, pages, topic, category, styleAnalysis, referenceImages, user, modelId }) {
  const taskDir = path.join(outputRoot, taskId)
  if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true })

  const outlineText = buildOutlineText(pages)
  const total = pages.length
  const refImage = referenceImages?.[0] || undefined
  const concurrency = await getUserImageConcurrency(user)

  const coverIndex = pages.findIndex((p) => p.type === 'cover')
  const orderedIndices = []
  if (coverIndex !== -1) orderedIndices.push(coverIndex)
  for (let i = 0; i < total; i++) {
    if (i !== coverIndex) orderedIndices.push(i)
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  let completedCount = 0

  // 按并发数分批处理
  for (let i = 0; i < orderedIndices.length; i += concurrency) {
    const batch = orderedIndices.slice(i, i + concurrency)
    if (res.destroyed) return

    for (const idx of batch) {
      sendEvent('progress', { index: idx, status: 'generating', current: completedCount + 1, total })
    }

    const results = await Promise.allSettled(
      batch.map(async (idx) => {
        const page = pages[idx]
        const prompt = await buildImagePrompt(page, topic, category, outlineText, styleAnalysis, user, modelId)
        const imageBuffer = await generateImage(prompt, { referenceImage: refImage, user, modelId })
        const filename = `${idx}.png`
        fs.writeFileSync(path.join(taskDir, filename), imageBuffer)
        return { idx, filename }
      })
    )

    for (let ri = 0; ri < results.length; ri++) {
      const result = results[ri]
      completedCount++
      if (result.status === 'fulfilled') {
        const { idx, filename } = result.value
        sendEvent('complete', { index: idx, status: 'done', imageUrl: `/api/images/${taskId}/${filename}` })
      } else {
        const idx = batch[ri]
        sendEvent('error', { index: idx, status: 'error', message: result.reason?.message || '图片生成失败', retryable: true })
      }
    }
  }

  sendEvent('finish', { taskId, total, completed: completedCount })
  res.end()
}

async function retrySingleImage({ taskId, page, topic, category, pages, styleAnalysis, referenceImages, user, modelId }) {
  const taskDir = path.join(outputRoot, taskId)
  if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true })

  const outlineText = buildOutlineText(pages)
  const refImage = referenceImages?.[0] || undefined
  const prompt = await buildImagePrompt(page, topic, category, outlineText, styleAnalysis, user, modelId)
  const imageBuffer = await generateImage(prompt, { referenceImage: refImage, user, modelId })

  const filename = `${page.index}.png`
  fs.writeFileSync(path.join(taskDir, filename), imageBuffer)

  return { imageUrl: `/api/images/${taskId}/${filename}` }
}

function createTaskId() {
  return `task_${uuidv4().replace(/-/g, '').slice(0, 12)}`
}

module.exports = { generateImages, retrySingleImage, createTaskId }
