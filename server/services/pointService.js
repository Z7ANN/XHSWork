const userRepository = require('../repositories/userRepository')
const pointRepository = require('../repositories/pointRepository')
const configRepository = require('../repositories/configRepository')
const { getModelById } = require('./aiModelService')
const { createError, ErrorCode } = require('../utils/response')

const validateBalance = async (userId, cost) => {
  const user = await userRepository.findById(userId)
  if (!user) throw createError('用户不存在', ErrorCode.NOT_FOUND)
  if (user.points < cost) throw createError(`积分不足，需要 ${cost} 积分，当前余额 ${user.points}`, ErrorCode.BAD_REQUEST)
}

const consumeByModel = async (userId, modelId, remark, enableThinking = false) => {
  const model = await getModelById(modelId)
  let cost = model.pointsCost || 0
  if (enableThinking && model.supportThinking) cost += (model.thinkingPointsCost || 0)
  if (cost <= 0) return 0
  await validateBalance(userId, cost)
  await userRepository.deductPoints(userId, cost)
  const thinkingLabel = enableThinking && model.supportThinking ? '（深度思考）' : ''
  await pointRepository.create(userId, -cost, 'consume', `${remark}${thinkingLabel}（${model.name}）`)
  return cost
}

const consumeByConfig = async (userId, configKey, remark) => {
  const config = await configRepository.findByKey(configKey)
  const cost = parseInt(config?.configValue) || 0
  if (cost <= 0) return 0
  await validateBalance(userId, cost)
  await userRepository.deductPoints(userId, cost)
  await pointRepository.create(userId, -cost, 'consume', remark)
  return cost
}

const consumeBatch = async (userId, modelId, count, remark) => {
  const model = await getModelById(modelId)
  const totalCost = (model.pointsCost || 0) * count
  if (totalCost <= 0) return 0
  await validateBalance(userId, totalCost)
  await userRepository.deductPoints(userId, totalCost)
  await pointRepository.create(userId, -totalCost, 'consume', `${remark}（${model.name} × ${count}）`)
  return totalCost
}

const refundPoints = async (userId, amount, remark) => {
  if (amount <= 0) return
  await userRepository.addPoints(userId, amount)
  await pointRepository.create(userId, amount, 'refund', remark)
}

module.exports = { validateBalance, consumeByModel, consumeByConfig, consumeBatch, refundPoints }
