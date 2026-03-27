const pool = require('../database/db')
const crypto = require('crypto')

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(24)
  let code = ''
  for (let i = 0; i < 24; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return `${code.slice(0, 6)}-${code.slice(6, 12)}-${code.slice(12, 18)}-${code.slice(18, 24)}`
}

const create = async ({ packageId, points, vipDays, remark, expireAt, count = 1 }) => {
  const codes = []
  for (let i = 0; i < count; i++) {
    const code = generateCode()
    const [result] = await pool.query(
      'INSERT INTO redeem_codes (code, packageId, points, vipDays, remark, expireAt) VALUES (?, ?, ?, ?, ?, ?)',
      [code, packageId || null, points || 0, vipDays || 0, remark || '', expireAt || null]
    )
    codes.push({ id: result.insertId, code })
  }
  return codes
}

const findByCode = async (code) => {
  const [rows] = await pool.query('SELECT * FROM redeem_codes WHERE code = ?', [code])
  return rows[0] || null
}

const markUsed = async (id, userId) => {
  await pool.query('UPDATE redeem_codes SET usedBy = ?, usedAt = NOW() WHERE id = ?', [userId, id])
}

const findAll = async ({ page = 1, pageSize = 20, status, keyword } = {}) => {
  let where = 'WHERE 1=1'
  const params = []
  if (status === 'used') {
    where += ' AND r.usedBy IS NOT NULL'
  } else if (status === 'unused') {
    where += ' AND r.usedBy IS NULL AND (r.expireAt IS NULL OR r.expireAt > NOW())'
  } else if (status === 'expired') {
    where += ' AND r.usedBy IS NULL AND r.expireAt IS NOT NULL AND r.expireAt < NOW()'
  }
  if (keyword) {
    where += ' AND (r.code LIKE ? OR r.remark LIKE ? OR u.email LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
  }
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM redeem_codes r LEFT JOIN users u ON u.id = r.usedBy ${where}`, params
  )
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    `SELECT r.*, p.name as packageName, u.email as usedByEmail
     FROM redeem_codes r
     LEFT JOIN packages p ON p.id = r.packageId
     LEFT JOIN users u ON u.id = r.usedBy
     ${where} ORDER BY r.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return { list, total }
}

const remove = async (id) => {
  await pool.query('DELETE FROM redeem_codes WHERE id = ? AND usedBy IS NULL', [id])
}

const statsForDashboard = async () => {
  const [[row]] = await pool.query(
    'SELECT COUNT(*) as total, SUM(CASE WHEN usedBy IS NOT NULL THEN 1 ELSE 0 END) as used FROM redeem_codes'
  )
  return { total: row.total, used: row.used }
}

module.exports = { create, findByCode, markUsed, findAll, remove, statsForDashboard }
