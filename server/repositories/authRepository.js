const pool = require('../database/db')
const crypto = require('crypto')

const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
  return rows[0] || null
}

const generateInviteCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  const bytes = crypto.randomBytes(4)
  for (let i = 0; i < 4; i++) code += chars[bytes[i] % chars.length]
  return code
}

const createUser = async (email, password = '', invitedBy = null, registerIp = '') => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode()
    try {
      const [result] = await pool.query(
        'INSERT INTO users (email, password, inviteCode, invitedBy, registerIp) VALUES (?, ?, ?, ?, ?)',
        [email, password, inviteCode, invitedBy, registerIp]
      )
      return result.insertId
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('uk_invite_code')) continue
      throw err
    }
  }
  throw new Error('生成邀请码失败，请重试')
}

const updateLastLogin = async (id) => {
  await pool.query('UPDATE users SET lastLoginAt = NOW() WHERE id = ?', [id])
}

const updatePassword = async (id, password) => {
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, id])
}

const saveVerifyCode = async (email, code, expireAt) => {
  await pool.query(
    'INSERT INTO verify_codes (email, code, expireAt) VALUES (?, ?, ?)',
    [email, code, expireAt]
  )
}

const findValidCode = async (email, code) => {
  const [rows] = await pool.query(
    'SELECT * FROM verify_codes WHERE email = ? AND code = ? AND used = 0 AND expireAt > NOW() ORDER BY id DESC LIMIT 1',
    [email, code]
  )
  return rows[0] || null
}

const markCodeUsed = async (id) => {
  await pool.query('UPDATE verify_codes SET used = 1 WHERE id = ?', [id])
}

module.exports = { findUserByEmail, createUser, updateLastLogin, updatePassword, saveVerifyCode, findValidCode, markCodeUsed }
