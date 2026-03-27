const pool = require('../database/db')

const findAll = async ({ page = 1, pageSize = 20, keyword = '', status, vip } = {}) => {
  let where = 'WHERE 1=1'
  const params = []
  if (keyword) {
    where += ' AND (u.email LIKE ? OR u.nickname LIKE ? OR u.registerIp LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  if (status !== undefined) {
    where += ' AND u.status = ?'
    params.push(status)
  }
  if (vip === 1) {
    where += ' AND u.vipExpireAt > NOW()'
  } else if (vip === 0) {
    where += ' AND (u.vipExpireAt IS NULL OR u.vipExpireAt <= NOW())'
  }
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM users u ${where}`, params
  )
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    `SELECT u.id, u.email, u.nickname, u.avatar, u.role, u.status, u.points,
            u.vipExpireAt, u.inviteCode, u.invitedBy, u.lastLoginAt, u.registerIp, u.createdAt,
            (SELECT COUNT(*) FROM users WHERE invitedBy = u.id) as inviteCount
     FROM users u ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return { list, total }
}

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
  return rows[0] || null
}

const updateStatus = async (id, status) => {
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id])
}

const updateProfile = async (id, { nickname, avatar }) => {
  const fields = []
  const params = []
  if (nickname !== undefined) { fields.push('nickname = ?'); params.push(nickname) }
  if (avatar !== undefined) { fields.push('avatar = ?'); params.push(avatar) }
  if (fields.length === 0) return
  params.push(id)
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)
}

const getStats = async (userId) => {
  const [rows] = await pool.query(
    'SELECT type, COUNT(*) as count FROM generations WHERE userId = ? GROUP BY type',
    [userId]
  )
  const stats = { oneclick: 0, editor: 0, cover: 0 }
  for (const row of rows) stats[row.type] = row.count
  return stats
}

const count = async () => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM users')
  return total
}

const countToday = async () => {
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) as total FROM users WHERE DATE(createdAt) = CURDATE()'
  )
  return total
}

const findByInviteCode = async (code) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE inviteCode = ?', [code])
  return rows[0] || null
}

const addPoints = async (userId, amount) => {
  await pool.query('UPDATE users SET points = points + ? WHERE id = ?', [amount, userId])
}

const findInvitees = async (userId, { page = 1, pageSize = 20 } = {}) => {
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) as total FROM users WHERE invitedBy = ?', [userId]
  )
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    'SELECT id, email, nickname, avatar, createdAt FROM users WHERE invitedBy = ? ORDER BY id DESC LIMIT ? OFFSET ?',
    [userId, pageSize, offset]
  )
  return { list, total }
}

const bindInviter = async (userId, inviterId) => {
  await pool.query('UPDATE users SET invitedBy = ? WHERE id = ? AND invitedBy IS NULL', [inviterId, userId])
}

const deductPoints = async (userId, amount) => {
  const [result] = await pool.query('UPDATE users SET points = points - ? WHERE id = ? AND points >= ?', [amount, userId, amount])
  if (result.affectedRows === 0) {
    throw new Error('积分不足')
  }
}

const extendVip = async (userId, days) => {
  await pool.query(
    'UPDATE users SET vipExpireAt = GREATEST(COALESCE(vipExpireAt, NOW()), NOW()) + INTERVAL ? DAY WHERE id = ?',
    [days, userId]
  )
}

const getInviteStats = async (userId) => {
  const [[stats]] = await pool.query(`
    SELECT
      COUNT(*) as inviteCount,
      COALESCE(SUM(CASE WHEN o.totalPaid > 0 THEN 1 ELSE 0 END), 0) as paidCount
    FROM users u
    LEFT JOIN (
      SELECT userId, SUM(amount) as totalPaid
      FROM orders WHERE status = 1
      GROUP BY userId
    ) o ON o.userId = u.id
    WHERE u.invitedBy = ?
  `, [userId])

  const [[reward]] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as totalEarned FROM point_logs WHERE userId = ? AND type = ?',
    [userId, 'invite_reward']
  )

  return {
    inviteCount: stats.inviteCount,
    paidCount: stats.paidCount,
    totalEarned: reward.totalEarned,
  }
}

const setVipExpireAt = async (id, vipExpireAt) => {
  await pool.query('UPDATE users SET vipExpireAt = ? WHERE id = ?', [vipExpireAt, id])
}

const getConsumedPoints = async (userId) => {
  const [[{ total }]] = await pool.query(
    'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM point_logs WHERE userId = ? AND amount < 0',
    [userId]
  )
  return total
}

const getCurrentSubscription = async (userId) => {
  const [[row]] = await pool.query(
    `SELECT p.name, p.type FROM orders o
     JOIN packages p ON p.id = o.packageId
     WHERE o.userId = ? AND o.status = 1 AND p.type != 'topup'
     ORDER BY o.paidAt DESC LIMIT 1`,
    [userId]
  )
  return row || null
}

const updatePassword = async (id, hashedPassword) => {
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id])
}

const updateEmail = async (id, email) => {
  await pool.query('UPDATE users SET email = ? WHERE id = ?', [email, id])
}

module.exports = { findAll, findById, updateStatus, updateProfile, getStats, count, countToday, findByInviteCode, addPoints, deductPoints, extendVip, findInvitees, bindInviter, getInviteStats, setVipExpireAt, getConsumedPoints, getCurrentSubscription, updatePassword, updateEmail }
