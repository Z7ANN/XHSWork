const pool = require('../database/db')

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM packages WHERE status = 1 ORDER BY sortOrder ASC')
  return rows
}

const findAllAdmin = async ({ status } = {}) => {
  let where = 'WHERE 1=1'
  const params = []
  if (status !== undefined) {
    where += ' AND status = ?'
    params.push(status)
  }
  const [rows] = await pool.query(`SELECT * FROM packages ${where} ORDER BY sortOrder ASC`, params)
  return rows
}

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM packages WHERE id = ?', [id])
  return rows[0] || null
}

const create = async (data) => {
  const { name, type, price, originalPrice, points, vipDays, features, badge, sortOrder, status } = data
  const [result] = await pool.query(
    'INSERT INTO packages (name, type, price, originalPrice, points, vipDays, features, badge, sortOrder, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, type, price, originalPrice || 0, points, vipDays || 0, JSON.stringify(features), badge || '', sortOrder || 0, status ?? 1]
  )
  return result.insertId
}

const update = async (id, data) => {
  const allowedFields = ['name', 'type', 'price', 'originalPrice', 'points', 'vipDays', 'features', 'badge', 'imageConcurrency', 'sortOrder', 'status']
  const fields = []
  const params = []
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      if (key === 'features') {
        fields.push('features = ?')
        params.push(JSON.stringify(data[key]))
      } else {
        fields.push(`${key} = ?`)
        params.push(data[key])
      }
    }
  }
  if (!fields.length) return
  params.push(id)
  await pool.query(`UPDATE packages SET ${fields.join(', ')} WHERE id = ?`, params)
}

const remove = async (id) => {
  await pool.query('DELETE FROM packages WHERE id = ?', [id])
}

const hasOrders = async (id) => {
  const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE packageId = ?', [id])
  return count > 0
}

module.exports = { findAll, findAllAdmin, findById, create, update, remove, hasOrders }
