const pool = require('../database/db')

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM system_configs ORDER BY id ASC')
  return rows
}

const findByKey = async (configKey) => {
  const [rows] = await pool.query('SELECT * FROM system_configs WHERE configKey = ?', [configKey])
  return rows[0] || null
}

const upsert = async (configKey, configValue, description) => {
  await pool.query(
    `INSERT INTO system_configs (configKey, configValue, description)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE configValue = VALUES(configValue), description = VALUES(description)`,
    [configKey, configValue, description || '']
  )
}

const batchUpdate = async (configs) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    for (const { configKey, configValue, description } of configs) {
      await conn.query(
        `INSERT INTO system_configs (configKey, configValue, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE configValue = VALUES(configValue), description = VALUES(description)`,
        [configKey, configValue, description || '']
      )
    }
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = { findAll, findByKey, upsert, batchUpdate }
