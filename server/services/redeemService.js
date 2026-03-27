const redeemRepository = require('../repositories/redeemRepository')
const userRepository = require('../repositories/userRepository')
const pointRepository = require('../repositories/pointRepository')
const packageRepository = require('../repositories/packageRepository')
const { createError, ErrorCode } = require('../utils/response')

async function createCodes(data) {
  if (data.packageId) {
    const pkg = await packageRepository.findById(data.packageId)
    if (!pkg) throw createError('套餐不存在', ErrorCode.NOT_FOUND)
    data.points = pkg.points
    data.vipDays = pkg.vipDays
  }
  if (!data.points && !data.vipDays) throw createError('积分或VIP天数至少填一项', ErrorCode.BAD_REQUEST)
  return await redeemRepository.create(data)
}

async function redeem(userId, code) {
  const record = await redeemRepository.findByCode(code)
  if (!record) throw createError('兑换码无效', ErrorCode.BAD_REQUEST)
  if (record.usedBy) throw createError('兑换码已被使用', ErrorCode.BAD_REQUEST)
  if (record.expireAt && new Date(record.expireAt) < new Date()) throw createError('兑换码已过期', ErrorCode.BAD_REQUEST)

  await redeemRepository.markUsed(record.id, userId)

  if (record.points > 0) {
    await userRepository.addPoints(userId, record.points)
    await pointRepository.create(userId, record.points, 'purchase', `兑换码充值 ${code}`)
  }
  if (record.vipDays > 0) {
    await userRepository.extendVip(userId, record.vipDays)
  }

  return { points: record.points, vipDays: record.vipDays }
}

async function getList(params) {
  return await redeemRepository.findAll(params)
}

async function remove(id) {
  await redeemRepository.remove(id)
}

module.exports = { createCodes, redeem, getList, remove }
