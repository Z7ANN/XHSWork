const pool = require('../database/db')

const create = async (userId, amount, type, remark = '') => {
  const [result] = await pool.query(
    'INSERT INTO point_logs (userId, amount, type, remark) VALUES (?, ?, ?, ?)',
    [userId, amount, type, remark]
  )
  return result.insertId
}

const findByUserId = async (userId, { page = 1, pageSize = 20 } = {}) => {
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) as total FROM point_logs WHERE userId = ?', [userId]
  )
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    'SELECT * FROM point_logs WHERE userId = ? ORDER BY id DESC LIMIT ? OFFSET ?',
    [userId, pageSize, offset]
  )
  return { list, total }
}

const findAll = async ({ page = 1, pageSize = 20, userId, type, keyword } = {}) => {
  let where = '1=1'
  const values = []
  if (userId) { where += ' AND p.userId = ?'; values.push(userId) }
  if (type) { where += ' AND p.type = ?'; values.push(type) }
  if (keyword) { where += ' AND (u.email LIKE ? OR u.nickname LIKE ? OR p.remark LIKE ?)'; values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`) }
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM point_logs p JOIN users u ON u.id = p.userId WHERE ${where}`, values)
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    `SELECT p.*, u.email, u.nickname FROM point_logs p JOIN users u ON u.id = p.userId WHERE ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
    [...values, pageSize, offset]
  )
  return { list, total }
}

const statsForDashboard = async () => {
  const [[row]] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as totalAdded,
      COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as totalConsumed
    FROM point_logs
  `)
  return { totalAdded: row.totalAdded, totalConsumed: row.totalConsumed }
}

module.exports = { create, findByUserId, findAll, statsForDashboard }
