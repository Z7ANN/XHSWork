const pool = require('../database/db')

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM ai_models ORDER BY type, tier, id')
  return rows
}

const findById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM ai_models WHERE id = ?', [id])
  return row || null
}

const findEnabled = async (type, tier) => {
  const [rows] = await pool.query(
    'SELECT * FROM ai_models WHERE type = ? AND (tier = ? OR tier = "all") AND status = 1 ORDER BY id',
    [type, tier]
  )
  return rows
}

const create = async (data) => {
  const { name, icon, type, tier, baseUrl, apiKey, model, pointsCost, supportThinking, thinkingPointsCost, status } = data
  const [result] = await pool.query(
    'INSERT INTO ai_models (name, icon, type, tier, baseUrl, apiKey, model, pointsCost, supportThinking, thinkingPointsCost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, icon || '', type, tier || 'all', baseUrl, apiKey, model, pointsCost ?? 10, supportThinking ?? 0, thinkingPointsCost ?? 0, status ?? 1]
  )
  return result.insertId
}

const update = async (id, data) => {
  const fields = []
  const params = []
  for (const key of ['name', 'icon', 'type', 'tier', 'baseUrl', 'apiKey', 'model', 'pointsCost', 'supportThinking', 'thinkingPointsCost', 'status']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(data[key])
    }
  }
  if (!fields.length) return
  params.push(id)
  await pool.query(`UPDATE ai_models SET ${fields.join(', ')} WHERE id = ?`, params)
}

const remove = async (id) => {
  await pool.query('DELETE FROM ai_models WHERE id = ?', [id])
}

module.exports = { findAll, findById, findEnabled, create, update, remove }
