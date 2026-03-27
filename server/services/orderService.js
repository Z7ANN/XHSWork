const orderRepository = require('../repositories/orderRepository')
const packageRepository = require('../repositories/packageRepository')
const userRepository = require('../repositories/userRepository')
const pointRepository = require('../repositories/pointRepository')
const configRepository = require('../repositories/configRepository')
const { createWechatPay, createAlipayPay } = require('./payService')
const { createError, ErrorCode } = require('../utils/response')

function generateOrderNo() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `${date}${rand}`
}

async function validatePayConfig(method) {
  const prefix = method === 'wechat' ? 'pay_wechat' : 'pay_alipay'
  const enabled = await configRepository.findByKey(`${prefix}_enabled`)
  if (!enabled || enabled.configValue !== '1') {
    throw createError(`${method === 'wechat' ? '微信' : '支付宝'}支付未开启`, ErrorCode.BAD_REQUEST)
  }
}

async function createOrder(userId, { packageId, payMethod }) {
  if (!['wechat', 'alipay'].includes(payMethod)) {
    throw createError('不支持的支付方式', ErrorCode.BAD_REQUEST)
  }
  const pkg = await packageRepository.findById(packageId)
  if (!pkg || pkg.status !== 1) throw createError('套餐不存在或已下架', ErrorCode.BAD_REQUEST)
  if (pkg.price <= 0) throw createError('该套餐无需购买', ErrorCode.BAD_REQUEST)

  if (pkg.type === 'trial') {
    const hasBought = await orderRepository.hasUserBoughtTrial(userId)
    if (hasBought) throw createError('体验包仅限购买一次', ErrorCode.BAD_REQUEST)
  }

  await validatePayConfig(payMethod)

  const orderNo = generateOrderNo()
  const expireAt = new Date(Date.now() + 30 * 60 * 1000)
  const description = `${pkg.name} - ${pkg.points}积分${pkg.vipDays > 0 ? ` + VIP${pkg.vipDays}天` : ''}`

  let qrCodeUrl = ''
  if (payMethod === 'wechat') {
    qrCodeUrl = await createWechatPay(orderNo, pkg.price, description)
  } else {
    qrCodeUrl = await createAlipayPay(orderNo, pkg.price, description)
  }

  await orderRepository.create({
    orderNo, userId, packageId,
    amount: pkg.price,
    pointsGranted: pkg.points,
    vipDaysGranted: pkg.vipDays,
    payMethod, qrCodeUrl, expireAt,
  })

  const order = await orderRepository.findByOrderNo(orderNo)
  return { ...order, packageName: pkg.name }
}

async function getOrderStatus(orderNo, userId) {
  const order = await orderRepository.findByOrderNo(orderNo)
  if (!order) throw createError('订单不存在', ErrorCode.NOT_FOUND)
  if (order.userId !== userId) throw createError('无权查看', ErrorCode.FORBIDDEN)

  // 待支付订单主动查询支付平台
  if (order.status === 0) {
    try {
      const { queryWechatPayStatus, queryAlipayPayStatus } = require('./payService')
      const queryFn = order.payMethod === 'wechat' ? queryWechatPayStatus : queryAlipayPayStatus
      const result = await queryFn(orderNo)
      if (result.paid) {
        const updated = await handlePayNotify(orderNo, result.tradeNo)
        return updated
      }
    } catch {}
  }

  return order
}

async function getUserOrders(userId, { page, pageSize }) {
  return orderRepository.findByUser(userId, { page, pageSize })
}

async function cancelOrder(orderNo, userId) {
  const order = await orderRepository.findByOrderNo(orderNo)
  if (!order) throw createError('订单不存在', ErrorCode.NOT_FOUND)
  if (order.userId !== userId) throw createError('无权操作', ErrorCode.FORBIDDEN)
  if (order.status !== 0) throw createError('订单状态不允许取消', ErrorCode.BAD_REQUEST)
  await orderRepository.updateStatus(orderNo, 2)
}

async function handlePayNotify(orderNo, payTradeNo) {
  const order = await orderRepository.findByOrderNo(orderNo)
  if (!order) throw createError('订单不存在', ErrorCode.NOT_FOUND)
  if (order.status !== 0) return order

  const pool = require('../database/db')
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 更新订单状态
    await conn.query(
      'UPDATE orders SET status = 1, payTradeNo = ?, paidAt = ? WHERE orderNo = ? AND status = 0',
      [payTradeNo, new Date(), orderNo]
    )

    // 发放积分
    if (order.pointsGranted > 0) {
      await conn.query('UPDATE users SET points = points + ? WHERE id = ?', [order.pointsGranted, order.userId])
      const [[pkg]] = await conn.query('SELECT name FROM packages WHERE id = ?', [order.packageId])
      await conn.query(
        'INSERT INTO point_logs (userId, amount, type, remark) VALUES (?, ?, ?, ?)',
        [order.userId, order.pointsGranted, 'purchase', `购买${pkg?.name || '套餐'}`]
      )
    }

    // 延长VIP
    if (order.vipDaysGranted > 0) {
      await conn.query(
        'UPDATE users SET vipExpireAt = GREATEST(COALESCE(vipExpireAt, NOW()), NOW()) + INTERVAL ? DAY WHERE id = ?',
        [order.vipDaysGranted, order.userId]
      )
    }

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }

  // 邀请奖励（事务外执行，失败不影响主流程）
  try {
    const user = await userRepository.findById(order.userId)
    if (user?.invitedBy) {
      await grantInviteRewards(order, user)
    }
  } catch (err) {
    console.error('[邀请奖励发放失败]', err.message)
  }

  return await orderRepository.findByOrderNo(orderNo)
}

async function grantInviteRewards(order, user) {
  const [modeVal, bonusModeVal, inviteVal, inviteeVal, bonusRateVal] = await Promise.all([
    configRepository.findByKey('invite_reward_mode'),
    configRepository.findByKey('invite_recharge_bonus_mode'),
    configRepository.findByKey('invite_reward_points'),
    configRepository.findByKey('invitee_reward_points'),
    configRepository.findByKey('invite_recharge_bonus_rate'),
  ])
  const mode = modeVal?.configValue || 'paid'
  const bonusMode = bonusModeVal?.configValue || 'first'
  const paidOrders = await orderRepository.countPaidOrders(order.userId)
  const isFirst = paidOrders === 1

  if (mode === 'paid' && isFirst) {
    const inviterPoints = parseInt(inviteVal?.configValue) || 0
    if (inviterPoints > 0) {
      await userRepository.addPoints(user.invitedBy, inviterPoints)
      await pointRepository.create(user.invitedBy, inviterPoints, 'invite_reward', `好友 ${user.email} 首次充值，邀请奖励`)
    }
    const inviteePoints = parseInt(inviteeVal?.configValue) || 0
    if (inviteePoints > 0) {
      await userRepository.addPoints(order.userId, inviteePoints)
      await pointRepository.create(order.userId, inviteePoints, 'invite_reward', '受邀充值奖励')
    }
  }

  const bonusRate = parseInt(bonusRateVal?.configValue) || 0
  const shouldGrantBonus = bonusMode === 'every' || (bonusMode === 'first' && isFirst)
  if (bonusRate > 0 && shouldGrantBonus) {
    const bonusPoints = Math.floor(order.pointsGranted * bonusRate / 100)
    if (bonusPoints > 0) {
      await userRepository.addPoints(user.invitedBy, bonusPoints)
      await pointRepository.create(user.invitedBy, bonusPoints, 'invite_reward', `好友 ${user.email} 充值，赠送${bonusRate}%积分`)
    }
  }
}

async function adminCancelOrder(orderNo) {
  const order = await orderRepository.findByOrderNo(orderNo)
  if (!order) throw createError('订单不存在', ErrorCode.NOT_FOUND)
  if (order.status !== 0) throw createError('只能取消待支付订单', ErrorCode.BAD_REQUEST)
  await orderRepository.updateStatus(orderNo, 2)
}

async function adminCompleteOrder(orderNo) {
  const order = await orderRepository.findByOrderNo(orderNo)
  if (!order) throw createError('订单不存在', ErrorCode.NOT_FOUND)
  if (order.status !== 0) throw createError('只能完成待支付订单', ErrorCode.BAD_REQUEST)
  return handlePayNotify(orderNo, `ADMIN_${Date.now()}`)
}

async function getAllOrders(params) {
  return orderRepository.findAll(params)
}

module.exports = { createOrder, getOrderStatus, getUserOrders, cancelOrder, handlePayNotify, getAllOrders, adminCancelOrder, adminCompleteOrder }
