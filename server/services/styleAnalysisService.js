const { generateText } = require('../utils/ai')

const promptTemplate = require('../prompts/style_analysis')

async function analyzeStyle(referenceImages, user, modelId) {
  const imageContents = referenceImages.map((img) => ({
    type: 'image_url',
    image_url: { url: img },
  }))

  const suffix = referenceImages.length === 1
    ? '\n\n请分析这张参考图片的视觉风格。'
    : `\n\n请综合分析这 ${referenceImages.length} 张参考图片的视觉风格，提取它们的共同风格特征。`

  const messages = [
    {
      role: 'user',
      content: [
        ...imageContents,
        { type: 'text', text: promptTemplate + suffix },
      ],
    },
  ]

  const response = await generateText(null, {
    messages,
    temperature: 0.3,
    maxTokens: 1500,
    user,
    modelId,
  })

  return response.trim()
}

module.exports = { analyzeStyle }
