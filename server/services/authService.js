const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const authRepository = require('../repositories/authRepository')
const userRepository = require('../repositories/userRepository')
const pointRepository = require('../repositories/pointRepository')
const configRepository = require('../repositories/configRepository')
const { sendVerifyCode } = require('../utils/mailer')
const { createError, ErrorCode } = require('../utils/response')

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production'
const CODE_EXPIRE_MINUTES = 5
const SALT_ROUNDS = 10

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

function formatUser(user) {
  return { id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, role: user.role }
}

async function grantInviteRewardOnRegister(inviterId, inviteeId, inviteeEmail) {
  const modeVal = await configRepository.findByKey('invite_reward_mode')
  if (modeVal?.configValue !== 'register') return

  // 邀请人奖励
  const inviterVal = await configRepository.findByKey('invite_reward_points')
  const inviterPoints = parseInt(inviterVal?.configValue) || 0
  if (inviterPoints > 0) {
    await userRepository.addPoints(inviterId, inviterPoints)
    await pointRepository.create(inviterId, inviterPoints, 'invite_reward', `邀请 ${inviteeEmail} 注册`)
  }

  // 被邀请人奖励
  const inviteeVal = await configRepository.findByKey('invitee_reward_points')
  const inviteePoints = parseInt(inviteeVal?.configValue) || 0
  if (inviteePoints > 0) {
    await userRepository.addPoints(inviteeId, inviteePoints)
    await pointRepository.create(inviteeId, inviteePoints, 'invite_reward', '受邀注册奖励')
  }
}

async function sendCode(email) {
  const code = generateCode()
  const expireAt = new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000)
  await authRepository.saveVerifyCode(email, code, expireAt)
  await sendVerifyCode(email, code)
}

async function loginByCode(email, code, ip = '') {
  const record = await authRepository.findValidCode(email, code)
  if (!record) throw createError('验证码无效或已过期', ErrorCode.BAD_REQUEST)

  await authRepository.markCodeUsed(record.id)

  let user = await authRepository.findUserByEmail(email)
  if (!user) {
    const id = await authRepository.createUser(email, '', null, ip)
    user = { id, email, nickname: '', avatar: '', role: 'user', status: 1 }
  }

  if (user.status === 0) throw createError('账号已被禁用', ErrorCode.FORBIDDEN)

  await authRepository.updateLastLogin(user.id)
  const token = generateToken(user)
  return { token, user: formatUser(user) }
}

async function register(email, password, code, inviteCode = '', ip = '') {
  const record = await authRepository.findValidCode(email, code)
  if (!record) throw createError('验证码无效或已过期', ErrorCode.BAD_REQUEST)

  await authRepository.markCodeUsed(record.id)

  const existing = await authRepository.findUserByEmail(email)
  if (existing) throw createError('该邮箱已注册', ErrorCode.BAD_REQUEST)

  let inviterId = null
  if (inviteCode) {
    const inviter = await userRepository.findByInviteCode(inviteCode)
    if (!inviter) throw createError('邀请码无效', ErrorCode.BAD_REQUEST)
    inviterId = inviter.id
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const id = await authRepository.createUser(email, hashed, inviterId, ip)
  const user = { id, email, nickname: '', avatar: '', role: 'user', status: 1 }

  if (inviterId) {
    await grantInviteRewardOnRegister(inviterId, id, email)
  }

  await authRepository.updateLastLogin(id)
  const token = generateToken(user)
  return { token, user: formatUser(user) }
}

async function loginByPassword(email, password) {
  const user = await authRepository.findUserByEmail(email)
  if (!user) throw createError('邮箱或密码错误', ErrorCode.BAD_REQUEST)
  if (!user.password) throw createError('该账号未设置密码，请使用验证码登录', ErrorCode.BAD_REQUEST)
  if (user.status === 0) throw createError('账号已被禁用', ErrorCode.FORBIDDEN)

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw createError('邮箱或密码错误', ErrorCode.BAD_REQUEST)

  await authRepository.updateLastLogin(user.id)
  const token = generateToken(user)
  return { token, user: formatUser(user) }
}

async function resetPassword(email, password, code) {
  const record = await authRepository.findValidCode(email, code)
  if (!record) throw createError('验证码无效或已过期', ErrorCode.BAD_REQUEST)

  await authRepository.markCodeUsed(record.id)

  const user = await authRepository.findUserByEmail(email)
  if (!user) throw createError('用户不存在', ErrorCode.BAD_REQUEST)

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  await authRepository.updatePassword(user.id, hashed)
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = { sendCode, loginByCode, loginByPassword, register, resetPassword, verifyToken }
