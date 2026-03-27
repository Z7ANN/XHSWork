const OpenAI = require('openai')
const { getNextModel, getModelById } = require('../services/aiModelService')

const clientCache = new Map()

function getClient(baseUrl, apiKey) {
  const key = `${baseUrl}::${apiKey}`
  if (!clientCache.has(key)) {
    clientCache.set(key, new OpenAI({ baseURL: baseUrl, apiKey }))
  }
  return clientCache.get(key)
}

async function getUserTier(user) {
  if (!user?.id) return 'all'
  const orderRepository = require('../repositories/orderRepository')
  const order = await orderRepository.findLatestPaidSubscription(user.id)
  if (!order) return 'all'
  const packageRepository = require('../repositories/packageRepository')
  const pkg = await packageRepository.findById(order.packageId)
  return pkg?.type || 'all'
}

async function resolveModel(type, { modelId, user }) {
  if (modelId) return await getModelById(modelId)
  const tier = await getUserTier(user)
  return await getNextModel(type, tier)
}

async function generateText(promptOrOptions, { temperature = 0.8, maxTokens = 8000, messages, user, modelId, enableThinking } = {}) {
  const modelConfig = await resolveModel('text', { modelId, user })
  const client = getClient(modelConfig.baseUrl, modelConfig.apiKey)
  const finalMessages = messages
    || (typeof promptOrOptions === 'string'
      ? [{ role: 'user', content: promptOrOptions }]
      : promptOrOptions.messages)
  const thinkingParam = modelConfig.supportThinking && !enableThinking ? { thinking: { type: 'disabled' } } : {}
  const response = await client.chat.completions.create({
    model: modelConfig.model,
    messages: finalMessages,
    temperature,
    max_tokens: maxTokens,
    ...thinkingParam,
  })
  return response.choices[0].message.content
}

async function generateTextStream(promptOrOptions, { temperature = 0.8, maxTokens = 8000, user, modelId, enableThinking } = {}) {
  const modelConfig = await resolveModel('text', { modelId, user })
  const client = getClient(modelConfig.baseUrl, modelConfig.apiKey)
  const messages = typeof promptOrOptions === 'string'
    ? [{ role: 'user', content: promptOrOptions }]
    : promptOrOptions.messages
  const thinkingParam = modelConfig.supportThinking && !enableThinking ? { thinking: { type: 'disabled' } } : {}
  const stream = await client.chat.completions.create({
    model: modelConfig.model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
    ...thinkingParam,
  })
  return stream
}

async function generateImage(prompt, { size = '2K', referenceImage, user, modelId } = {}) {
  const modelConfig = await resolveModel('image', { modelId, user })
  const client = getClient(modelConfig.baseUrl, modelConfig.apiKey)
  const params = {
    model: modelConfig.model,
    prompt,
    size,
    response_format: 'b64_json',
  }
  if (referenceImage) {
    params.image = referenceImage
  }
  const response = await client.images.generate(params)
  return Buffer.from(response.data[0].b64_json, 'base64')
}

module.exports = { generateText, generateTextStream, generateImage, getUserTier, resolveModel }
