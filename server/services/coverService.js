const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { generateText, generateImage } = require('../utils/ai')

const promptGenTemplate = require('../prompts/cover_prompt_gen')

const outputRoot = path.join(__dirname, '../output')
if (!fs.existsSync(outputRoot)) fs.mkdirSync(outputRoot, { recursive: true })

async function generateCover({ prompt, style, size, referenceImage, user, modelId }) {
  const taskId = `cover_${uuidv4().replace(/-/g, '').slice(0, 12)}`
  const taskDir = path.join(outputRoot, taskId)
  if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true })

  const genPrompt = promptGenTemplate
    .replace('{userPrompt}', prompt)
    .replace('{style}', style)
    .replace('{size}', size)

  const detailedPrompt = await generateText(genPrompt, { temperature: 0.9, maxTokens: 2000, user })

  const imageBuffer = await generateImage(detailedPrompt.trim(), {
    size: '2K',
    referenceImage: referenceImage || undefined,
    user,
    modelId,
  })

  const filename = '0.png'
  fs.writeFileSync(path.join(taskDir, filename), imageBuffer)

  return { taskId, imageUrl: `/api/images/${taskId}/${filename}` }
}

module.exports = { generateCover }
