const pool = require('../database/db')

const create = async ({ userId, type, title, content, images, tags, topic, category, pointsCost, model }) => {
  const [result] = await pool.query(
    `INSERT INTO generations (userId, type, title, content, images, tags, topic, category, pointsCost, model) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, type, title || '', content || '', JSON.stringify(images || []), JSON.stringify(tags || []), topic || '', category || '', pointsCost || 0, model || '']
  )
  return result.insertId
}

const findByUserId = async (userId, { page = 1, pageSize = 20, type } = {}) => {
  const offset = (page - 1) * pageSize
  let where = 'WHERE userId = ?'
  const params = [userId]
  if (type) {
    where += ' AND type = ?'
    params.push(type)
  }
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM generations ${where}`, params)
  const [rows] = await pool.query(
    `SELECT * FROM generations ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return { list: rows, total }
}

const findById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM generations WHERE id = ?', [id])
  return row || null
}

const deleteById = async (id) => {
  await pool.query('DELETE FROM generations WHERE id = ?', [id])
}

const update = async (id, data) => {
  const fields = []
  const params = []
  for (const key of ['title', 'content', 'images', 'tags', 'topic', 'category', 'pointsCost', 'model']) {
    if (data[key] !== undefined) {
      if (key === 'images' || key === 'tags') {
        fields.push(`${key} = ?`)
        params.push(JSON.stringify(data[key]))
      } else {
        fields.push(`${key} = ?`)
        params.push(data[key])
      }
    }
  }
  if (!fields.length) return
  params.push(id)
  await pool.query(`UPDATE generations SET ${fields.join(', ')} WHERE id = ?`, params)
}

const countByType = async () => {
  const [rows] = await pool.query('SELECT type, COUNT(*) as count FROM generations GROUP BY type')
  return rows
}

const countToday = async () => {
  const [rows] = await pool.query('SELECT type, COUNT(*) as count FROM generations WHERE DATE(createdAt) = CURDATE() GROUP BY type')
  return rows
}

const countTotal = async () => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM generations')
  return total
}

const findAll = async ({ page = 1, pageSize = 20, type, keyword, category, startDate, endDate } = {}) => {
  let where = 'WHERE 1=1'
  const params = []
  if (type) {
    where += ' AND g.type = ?'
    params.push(type)
  }
  if (category) {
    where += ' AND g.category = ?'
    params.push(category)
  }
  if (startDate) {
    where += ' AND g.createdAt >= ?'
    params.push(`${startDate} 00:00:00`)
  }
  if (endDate) {
    where += ' AND g.createdAt <= ?'
    params.push(`${endDate} 23:59:59`)
  }
  if (keyword) {
    where += ' AND (u.email LIKE ? OR u.nickname LIKE ? OR g.title LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
  }
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM generations g LEFT JOIN users u ON u.id = g.userId ${where}`, params
  )
  const offset = (page - 1) * pageSize
  const [list] = await pool.query(
    `SELECT g.*, u.email, u.nickname
     FROM generations g
     LEFT JOIN users u ON u.id = g.userId
     ${where} ORDER BY g.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return { list, total }
}

const statsForAdmin = async () => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM generations')
  const [[{ today }]] = await pool.query('SELECT COUNT(*) as today FROM generations WHERE DATE(createdAt) = CURDATE()')
  const [byType] = await pool.query('SELECT type, COUNT(*) as count FROM generations GROUP BY type')
  const [categories] = await pool.query('SELECT DISTINCT category FROM generations WHERE category != "" ORDER BY category')
  return { total, today, byType, categories: categories.map(r => r.category) }
}

const deleteByIds = async (ids) => {
  if (!ids.length) return
  await pool.query(`DELETE FROM generations WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
}

module.exports = { create, findByUserId, findById, deleteById, update, countByType, countToday, countTotal, findAll, statsForAdmin, deleteByIds }
