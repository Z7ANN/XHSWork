const pool = require('../database/db')

const create = async ({ orderNo, userId, packageId, amount, pointsGranted, vipDaysGranted, payMethod, qrCodeUrl, expireAt }) => {
  const [result] = await pool.query(
    'INSERT INTO orders (orderNo, userId, packageId, amount, pointsGranted, vipDaysGranted, payMethod, qrCodeUrl, expireAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [orderNo, userId, packageId, amount, pointsGranted || 0, vipDaysGranted || 0, payMethod, qrCodeUrl, expireAt]
  )
  return result.insertId
}

const findByOrderNo = async (orderNo) => {
  const [rows] = await pool.query('SELECT * FROM orders WHERE orderNo = ?', [orderNo])
  return rows[0] || null
}

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id])
  return rows[0] || null
}

const findByUser = async (userId, { page = 1, pageSize = 20 } = {}) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM orders WHERE userId = ?', [userId])
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    'SELECT o.*, p.name as packageName FROM orders o LEFT JOIN packages p ON o.packageId = p.id WHERE o.userId = ? ORDER BY o.id DESC LIMIT ? OFFSET ?',
    [userId, pageSize, offset]
  )
  return { list, total }
}

const updateStatus = async (orderNo, status, extra = {}) => {
  const fields = ['status = ?']
  const params = [status]
  if (extra.payTradeNo) { fields.push('payTradeNo = ?'); params.push(extra.payTradeNo) }
  if (extra.paidAt) { fields.push('paidAt = ?'); params.push(extra.paidAt) }
  params.push(orderNo)
  await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE orderNo = ?`, params)
}

const findAll = async ({ page = 1, pageSize = 20, status, keyword, startDate, endDate } = {}) => {
  let where = 'WHERE 1=1'
  const params = []
  if (status !== undefined) { where += ' AND o.status = ?'; params.push(status) }
  if (keyword) {
    where += ' AND (o.orderNo LIKE ? OR u.email LIKE ? OR u.nickname LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
  }
  if (startDate) { where += ' AND o.createdAt >= ?'; params.push(startDate) }
  if (endDate) { where += ' AND o.createdAt <= ?'; params.push(endDate + ' 23:59:59') }
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM orders o LEFT JOIN users u ON o.userId = u.id ${where}`, params
  )
  // totalAmount 只统计已支付订单，用独立的条件
  let amountWhere = 'WHERE o.status = 1'
  const amountParams = []
  if (keyword) {
    amountWhere += ' AND (o.orderNo LIKE ? OR u.email LIKE ? OR u.nickname LIKE ?)'
    const kw = `%${keyword}%`
    amountParams.push(kw, kw, kw)
  }
  if (startDate) { amountWhere += ' AND o.createdAt >= ?'; amountParams.push(startDate) }
  if (endDate) { amountWhere += ' AND o.createdAt <= ?'; amountParams.push(endDate + ' 23:59:59') }
  const [[{ totalAmount }]] = await pool.query(
    `SELECT COALESCE(SUM(o.amount), 0) as totalAmount FROM orders o LEFT JOIN users u ON o.userId = u.id ${amountWhere}`, amountParams
  )
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    `SELECT o.*, u.email, u.nickname, p.name as packageName FROM orders o LEFT JOIN users u ON o.userId = u.id LEFT JOIN packages p ON o.packageId = p.id ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return { list, total, totalAmount: Number(totalAmount) }
}

const statsForDashboard = async () => {
  const [[revenue]] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as totalRevenue, COUNT(*) as totalOrders FROM orders WHERE status = 1'
  )
  const [[todayRevenue]] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as todayRevenue, COUNT(*) as todayOrders FROM orders WHERE status = 1 AND DATE(paidAt) = CURDATE()'
  )
  return {
    totalRevenue: Number(revenue.totalRevenue),
    totalOrders: revenue.totalOrders,
    todayRevenue: Number(todayRevenue.todayRevenue),
    todayOrders: todayRevenue.todayOrders,
  }
}

const hasUserBoughtTrial = async (userId) => {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) as count FROM orders o JOIN packages p ON o.packageId = p.id WHERE o.userId = ? AND p.type = "trial" AND o.status IN (0, 1)',
    [userId]
  )
  return count > 0
}

const countPaidOrders = async (userId) => {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) as count FROM orders WHERE userId = ? AND status = 1',
    [userId]
  )
  return count
}

const findLatestPaidSubscription = async (userId) => {
  const [rows] = await pool.query(
    `SELECT o.* FROM orders o
     JOIN packages p ON p.id = o.packageId
     WHERE o.userId = ? AND o.status = 1 AND p.type != 'topup'
     ORDER BY o.paidAt DESC LIMIT 1`,
    [userId]
  )
  return rows[0] || null
}

module.exports = { create, findByOrderNo, findById, findByUser, updateStatus, findAll, statsForDashboard, hasUserBoughtTrial, countPaidOrders, findLatestPaidSubscription }
