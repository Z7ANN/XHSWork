const bcrypt = require('bcrypt')
const userRepository = require('../repositories/userRepository')
const pointRepository = require('../repositories/pointRepository')
const configRepository = require('../repositories/configRepository')
const { createError, ErrorCode } = require('../utils/response')

const SALT_ROUNDS = 10

async function validateUserExists(id) {
  const user = await userRepository.findById(id)
  if (!user) throw createError('用户不存在', ErrorCode.NOT_FOUND)
  return user
}

async function getProfile(userId) {
  const user = await userRepository.findById(userId)
  if (!user) throw createError('用户不存在', ErrorCode.UNAUTHORIZED)
  const [stats, consumedPoints, subscription] = await Promise.all([
    userRepository.getStats(userId),
    userRepository.getConsumedPoints(userId),
    userRepository.getCurrentSubscription(userId),
  ])
  const isVip = user.vipExpireAt ? new Date(user.vipExpireAt) > new Date() : false
  const finalSubscription = subscription || (isVip ? { name: 'VIP 会员', type: 'vip' } : null)
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    points: user.points,
    consumedPoints,
    vipExpireAt: user.vipExpireAt,
    isVip,
    subscription: finalSubscription,
    hasPassword: !!user.password,
    inviteCode: user.inviteCode,
    invitedBy: user.invitedBy,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    stats,
  }
}

async function updateProfile(userId, data) {
  await userRepository.updateProfile(userId, data)
  return await getProfile(userId)
}

async function getPointLogs(userId, page = 1) {
  return await pointRepository.findByUserId(userId, { page, pageSize: 10 })
}

async function getInviteList(userId, page = 1) {
  return await userRepository.findInvitees(userId, { page, pageSize: 10 })
}

async function getInviteStats(userId) {
  const stats = await userRepository.getInviteStats(userId)

  const [inviterReward, inviteeReward, rewardMode, rechargeBonus, rechargeBonusMode] = await Promise.all([
    configRepository.findByKey('invite_reward_points'),
    configRepository.findByKey('invitee_reward_points'),
    configRepository.findByKey('invite_reward_mode'),
    configRepository.findByKey('invite_recharge_bonus_rate'),
    configRepository.findByKey('invite_recharge_bonus_mode'),
  ])

  return {
    ...stats,
    config: {
      inviterReward: parseInt(inviterReward?.configValue) || 0,
      inviteeReward: parseInt(inviteeReward?.configValue) || 0,
      rewardMode: rewardMode?.configValue || 'paid',
      rechargeBonusRate: parseInt(rechargeBonus?.configValue) || 0,
      rechargeBonusMode: rechargeBonusMode?.configValue || 'first',
    },
  }
}

async function bindInviteCode(userId, inviteCode) {
  const user = await userRepository.findById(userId)
  if (!user) throw createError('用户不存在', ErrorCode.NOT_FOUND)
  if (user.invitedBy) throw createError('你已经绑定过邀请人', ErrorCode.BAD_REQUEST)

  const inviter = await userRepository.findByInviteCode(inviteCode)
  if (!inviter) throw createError('邀请码无效', ErrorCode.BAD_REQUEST)
  if (inviter.id === userId) throw createError('不能填写自己的邀请码', ErrorCode.BAD_REQUEST)

  await userRepository.bindInviter(userId, inviter.id)
}

async function getUsers(params) {
  return await userRepository.findAll(params)
}

async function getUserDetail(id) {
  const user = await validateUserExists(id)
  const [stats, inviteStats] = await Promise.all([
    userRepository.getStats(id),
    userRepository.getInviteStats(id),
  ])
  const isVip = user.vipExpireAt ? new Date(user.vipExpireAt) > new Date() : false
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    points: user.points,
    vipExpireAt: user.vipExpireAt,
    isVip,
    inviteCode: user.inviteCode,
    invitedBy: user.invitedBy,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    stats,
    inviteStats,
  }
}

async function updateUserStatus(id, status, adminId) {
  if (id === adminId) throw createError('不能修改自己的状态', ErrorCode.BAD_REQUEST)
  await validateUserExists(id)
  await userRepository.updateStatus(id, status)
}

async function adjustPoints(id, amount, remark) {
  await validateUserExists(id)
  if (amount > 0) {
    await userRepository.addPoints(id, amount)
  } else {
    await userRepository.deductPoints(id, Math.abs(amount))
  }
  await pointRepository.create(id, amount, 'admin_adjust', remark || '管理员调整')
}

async function setVipExpireAt(id, vipExpireAt) {
  await validateUserExists(id)
  await userRepository.setVipExpireAt(id, vipExpireAt)
}

async function resetPassword(id) {
  await validateUserExists(id)
  const hashed = await bcrypt.hash('123456', SALT_ROUNDS)
  await userRepository.updatePassword(id, hashed)
}

async function changePassword(userId, oldPassword, newPassword) {
  const user = await validateUserExists(userId)
  if (user.password) {
    if (!oldPassword) throw createError('请输入当前密码', ErrorCode.BAD_REQUEST)
    const match = await bcrypt.compare(oldPassword, user.password)
    if (!match) throw createError('当前密码错误', ErrorCode.BAD_REQUEST)
  }
  if (!newPassword || newPassword.length < 6) throw createError('新密码至少6位', ErrorCode.BAD_REQUEST)
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await userRepository.updatePassword(userId, hashed)
}

async function changeEmail(userId, newEmail, code) {
  if (!newEmail || !code) throw createError('缺少参数', ErrorCode.BAD_REQUEST)
  const authRepository = require('../repositories/authRepository')
  const record = await authRepository.findValidCode(newEmail, code)
  if (!record) throw createError('验证码无效或已过期', ErrorCode.BAD_REQUEST)
  await authRepository.markCodeUsed(record.id)

  const existing = await authRepository.findUserByEmail(newEmail)
  if (existing && existing.id !== userId) throw createError('该邮箱已被其他账号使用', ErrorCode.BAD_REQUEST)

  await userRepository.updateEmail(userId, newEmail)
  return await getProfile(userId)
}

module.exports = { getProfile, updateProfile, getPointLogs, getInviteList, getInviteStats, bindInviteCode, getUsers, getUserDetail, updateUserStatus, adjustPoints, setVipExpireAt, resetPassword, changePassword, changeEmail }
