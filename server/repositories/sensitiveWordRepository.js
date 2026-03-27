const pool = require('../database/db')

const findAll = async (params = {}) => {
  let sql = 'SELECT * FROM sensitive_words WHERE 1=1'
  const values = []
  if (params.category) { sql += ' AND category = ?'; values.push(params.category) }
  if (params.keyword) { sql += ' AND word LIKE ?'; values.push(`%${params.keyword}%`) }
  if (params.status !== undefined) { sql += ' AND status = ?'; values.push(params.status) }
  sql += ' ORDER BY category, id'
  const [rows] = await pool.query(sql, values)
  return rows
}

const findEnabled = async () => {
  const [rows] = await pool.query('SELECT id, word, category, replacements FROM sensitive_words WHERE status = 1 ORDER BY LENGTH(word) DESC')
  return rows.map(r => ({ ...r, replacements: typeof r.replacements === 'string' ? JSON.parse(r.replacements) : (r.replacements || []) }))
}

const findById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM sensitive_words WHERE id = ?', [id])
  return row || null
}

const create = async (data) => {
  const { word, category, replacements, status } = data
  const [result] = await pool.query(
    'INSERT INTO sensitive_words (word, category, replacements, status) VALUES (?, ?, ?, ?)',
    [word, category || 'other', JSON.stringify(replacements || []), status ?? 1]
  )
  return result.insertId
}

const update = async (id, data) => {
  const fields = []
  const params = []
  for (const key of ['word', 'category', 'status']) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]) }
  }
  if (data.replacements !== undefined) { fields.push('replacements = ?'); params.push(JSON.stringify(data.replacements)) }
  if (!fields.length) return
  params.push(id)
  await pool.query(`UPDATE sensitive_words SET ${fields.join(', ')} WHERE id = ?`, params)
}

const remove = async (id) => {
  await pool.query('DELETE FROM sensitive_words WHERE id = ?', [id])
}

const batchCreate = async (words) => {
  if (!words.length) return
  const sql = 'INSERT INTO sensitive_words (word, category, replacements, status) VALUES ?'
  const values = words.map(w => [w.word, w.category || 'other', JSON.stringify(w.replacements || []), w.status ?? 1])
  await pool.query(sql, [values])
}

module.exports = { findAll, findEnabled, findById, create, update, remove, batchCreate }
